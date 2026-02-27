/**
 * Google Sheets to CSV Sync
 *
 * Reads the "Automatic Links" tab from Google Sheets and writes it to
 * website-content/data/Automatic-Links.csv
 *
 * First run:        opens your browser to authorize access, saves a token
 * Subsequent runs:  uses the saved token automatically (no browser needed)
 *
 * Usage: node scripts/sheets-to-csv.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const { google } = require('googleapis');

// ─── Configuration ────────────────────────────────────────────────────────────

const SPREADSHEET_ID  = '14-7SwFKHwpMllwl3pbQaYu_FUTGekDMu8DP6gZsEJ50';
const SHEET_TAB_NAME  = 'Automatic Links';
const OUTPUT_CSV      = path.join(__dirname, '../website-content/data/Automatic-Links.csv');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const TOKEN_PATH      = path.join(__dirname, '../token.json');

// Read-only access to spreadsheets is all we need
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// ─── CSV Conversion ───────────────────────────────────────────────────────────

/**
 * Convert a 2D array of values (as returned by the Sheets API) into a CSV string.
 * Cells that contain commas, quotes or newlines are wrapped in double-quotes.
 */
function toCSV(rows) {
    return rows.map(row =>
        row.map(cell => {
            const str = (cell === null || cell === undefined) ? '' : String(cell);
            // Wrap in quotes if the cell contains a comma, double-quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',')
    ).join('\n');
}

// ─── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Return an authorized OAuth2 client.
 *
 * - If token.json already exists (from a previous run), load it and return immediately.
 * - Otherwise, open the browser for a one-time authorization and save the token.
 */
async function authorize(credentials) {
    const { client_id, client_secret } = credentials.installed;

    // We tell Google to redirect back to this local address after the user approves
    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        'http://localhost:3000/callback'
    );

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        oAuth2Client.setCredentials(token);
        console.log('✅ Using saved authorization token (token.json).');
        return oAuth2Client;
    }

    // No saved token yet — do the one-time browser flow
    return await authorizeInBrowser(oAuth2Client);
}

/**
 * Open the browser for the user to approve access, then wait for Google to
 * redirect back to our local server with an authorization code.
 * Exchange that code for a token and save it to token.json.
 */
async function authorizeInBrowser(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',  // 'offline' gives us a refresh token so this browser step only happens once
        scope: SCOPES,
    });

    console.log('\n🔐 First-time authorization required.');
    console.log('   Your browser should open automatically.');
    console.log('   If it does not, paste this URL into your browser:\n');
    console.log('   ' + authUrl + '\n');

    // Open the URL in the default browser (Windows)
    exec(`start "" "${authUrl}"`);

    // Start a temporary local web server that will receive the redirect from Google
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            // Ignore any requests that aren't the OAuth callback
            if (!req.url.startsWith('/callback')) return;

            const urlParams = new URL(req.url, 'http://localhost:3000');
            const code  = urlParams.searchParams.get('code');
            const error = urlParams.searchParams.get('error');

            if (error) {
                res.end('<h2>Authorization failed: ' + error + '</h2><p>You can close this tab.</p>');
                server.close();
                reject(new Error('Authorization failed: ' + error));
                return;
            }

            // Tell the browser everything went well
            res.end(`
                <h2 style="font-family:sans-serif;color:green">✅ Authorization successful!</h2>
                <p style="font-family:sans-serif">You can close this browser tab and return to the terminal.</p>
            `);
            server.close();

            // Exchange the one-time code for an access token + refresh token
            try {
                const { tokens } = await oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);

                // Save for future runs — token.json is in .gitignore so it stays private
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                console.log('✅ Authorization successful!');
                console.log('   Token saved to token.json.');
                console.log('   Future runs will skip the browser step entirely.\n');

                resolve(oAuth2Client);
            } catch (err) {
                reject(new Error('Failed to exchange authorization code: ' + err.message));
            }
        });

        server.listen(3000, () => {
            console.log('   Waiting for you to approve access in the browser...\n');
        });

        server.on('error', err => {
            reject(new Error(
                'Could not start local server on port 3000.\n' +
                'Something else may be using that port. Error: ' + err.message
            ));
        });
    });
}

// ─── Sheet → CSV ──────────────────────────────────────────────────────────────

/**
 * Fetch all data from the configured sheet tab and write it to Automatic-Links.csv.
 */
async function syncSheetToCSV(auth) {
    const sheets = google.sheets({ version: 'v4', auth });

    console.log(`📊 Reading "${SHEET_TAB_NAME}" from Google Sheets...`);

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_TAB_NAME,   // No cell range specified = entire tab
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
        throw new Error(`No data found in sheet tab "${SHEET_TAB_NAME}".`);
    }

    const headerRow  = rows[0];
    const dataRows   = rows.slice(1);
    const numColumns = headerRow.length;

    console.log(`   Columns : ${numColumns}`);
    console.log(`   Data rows: ${dataRows.length}`);

    // Some rows near the end may have fewer cells than the header if trailing
    // columns are empty. Pad them so the CSV stays rectangular.
    const normalizedRows = rows.map(row => {
        const padded = [...row];
        while (padded.length < numColumns) padded.push('');
        return padded;
    });

    const csvContent = toCSV(normalizedRows);

    console.log('\n💾 Writing Automatic-Links.csv...');
    fs.writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');

    console.log('✅ Done!');
    console.log(`   ${dataRows.length} rows written to:`);
    console.log(`   ${OUTPUT_CSV}\n`);
    console.log('Next step: run   node scripts/csv-to-lesson-plans-json.js   to regenerate the website catalog.');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
    try {
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            throw new Error(
                'credentials.json not found in the project root folder.\n' +
                'Download it from Google Cloud Console → APIs & Services → Credentials.'
            );
        }

        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));

        const auth = await authorize(credentials);
        await syncSheetToCSV(auth);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
