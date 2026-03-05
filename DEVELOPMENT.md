# Development Guide

This guide explains everything you need to set up this project on a new computer, keep the website in sync with Google Sheets, and preview the site locally.

---

## How the Data Pipeline Works

The website content is driven by a Google Sheet. The pipeline works like this:

```
Google Sheet ("Automatic Links" tab)
        ↓  scripts/sheets-to-csv.js
website-content/data/Automatic-Links.csv
        ↓  scripts/csv-to-lesson-plans-json.js
website-content/data/lesson-plans-catalog.json
        ↓
Website displays lesson plans
```

You never need to manually export anything from Google Sheets — the scripts handle it all.

---

## First-Time Setup

Follow these steps **once** when setting up the project on a new computer. After that, day-to-day use is just one command.

> **Prerequisites:** You need a Google account that has been given access to the "Automatic Links" spreadsheet. You also need the `credentials.json` file from the project maintainer (see Step 4 below). You do **not** need access to Google Cloud Console.

### Step 1 — Install Node.js

Node.js is the software that runs the scripts. Check if you already have it:

```powershell
node --version
```

If you see a version number (e.g. `v20.0.0`) you already have it — skip to Step 2.

If you get an error, [download and install Node.js from nodejs.org](https://nodejs.org/) (choose the LTS version). Then close and reopen your terminal and try again.

### Step 2 — Clone the Repository

If you haven't already cloned the project:

```powershell
git clone https://github.com/IDEMSInternational/cbckenyamathematics.git
cd cbckenyamathematics
```

### Step 3 — Install Dependencies

This installs the Google API library the sync script needs. Run this once from the project root folder:

```powershell
npm install
```

You should see output ending in `added X packages`. This creates a `node_modules/` folder — you never need to look inside it.

### Step 4 — Get credentials.json from the Maintainer

The sync script needs a file called `credentials.json` to identify itself to Google. This file is **not** stored in the repository for security reasons — ask the project maintainer to send it to you (by email, Slack, or a shared drive).

Once you have it:
1. Place it in the root of the project folder (same level as `index.html`):
   ```
   cbckenyamathematics/
   ├── credentials.json   ← place it here
   ├── index.html
   ├── scripts/
   └── ...
   ```
   > **Windows tip:** If the file saved as `credentials.json.json` (double extension), make sure file extensions are visible (**View → Show → File name extensions**) and rename it to remove the duplicate `.json`.
2. Do not share this file or commit it to GitHub — it is listed in `.gitignore` to prevent accidental commits.

### Step 5 — First-Time Authorization (one-time browser step)

Now run the build script for the first time:

```powershell
node scripts/website-build.js
```

Because this is the first run, it will:
1. Print a message saying **"First-time authorization required"**
2. Automatically open your web browser
3. Ask you to sign in with your Google account and grant read-only access to your spreadsheets
4. After you click **Allow**, show a success page — you can close that browser tab
5. Continue running and pulling data from the sheet

This browser step only happens **once**. The script saves a `token.json` file in the project root. On every future run it will use that saved token silently, with no browser needed.

> `token.json` is personal to your account and is listed in `.gitignore` — it will never be accidentally committed to GitHub. Do not share it with anyone.

---

## Day-to-Day Usage

Once setup is complete, you only need two commands.

### Update the website from Google Sheets

Run this any time the Google Sheet has been updated:

```powershell
node scripts/website-build.js
```

This runs the full pipeline automatically:
- Pulls the latest data from the "Automatic Links" tab in Google Sheets
- Writes it to `Automatic-Links.csv`
- Converts that CSV into `lesson-plans-catalog.json`
- Reports any issues with the data

Expected output:
```
────────────────────────────────────────────────────────────
  🏗️  CBC Kenya Mathematics — Website Build
────────────────────────────────────────────────────────────

📌 Step 1/2 — Syncing Google Sheets → Automatic-Links.csv
✅ Using saved authorization token (token.json).
📊 Reading "Automatic Links" from Google Sheets...
   Columns : 20
   Data rows: 131
💾 Writing Automatic-Links.csv...
✅ Done!

📌 Step 2/2 — Converting CSV → lesson-plans-catalog.json
📖 Reading CSV file...
🔨 Building lesson plans catalog...
   Generated 3 chapters
✅ Conversion completed successfully!

────────────────────────────────────────────────────────────
✅ Build complete! The website is ready.
────────────────────────────────────────────────────────────
```

After running the build, commit and push the updated data files to GitHub to publish the changes to the live website.

### Preview the website locally

Because the site loads content dynamically via JavaScript, you cannot just open `index.html` directly in a browser — you need a local web server. This command starts one:

```powershell
node scripts/website-serve.js
```

This will:
- Start a local web server (tries port 8080 first, then 8081, 8082, 3000, 3001)
- Automatically open the site in your default browser
- Keep running until you press **Ctrl+C** to stop it

Expected output:
```
────────────────────────────────────────────────────────────
  🌐  CBC Kenya Mathematics — Local Preview
────────────────────────────────────────────────────────────

  ✅  Server running at: http://localhost:8080

  Opening your browser now...

  Press Ctrl+C to stop.
```

---

## The Scripts Explained

### `scripts/website-build.js`
Orchestrates the full data pipeline. Calls `sheets-to-csv.js` then `csv-to-lesson-plans-json.js` in sequence. If either step fails, it stops and reports the error clearly.

### `scripts/sheets-to-csv.js`
Connects to Google Sheets using OAuth 2.0 and downloads the "Automatic Links" tab, writing it as `Automatic-Links.csv`. On first run, opens a browser to authorize. On subsequent runs, uses the saved `token.json` silently.

### `scripts/csv-to-lesson-plans-json.js`
Reads `Automatic-Links.csv` and converts it into the hierarchical `lesson-plans-catalog.json` that the website uses to display lesson plans.

### `scripts/website-serve.js`
Runs a local HTTP server so you can preview the website in your browser. Falls back through several port options, and falls back to Python's built-in server if all Node.js ports are busy.

---

## The Data Files

### `website-content/data/Automatic-Links.csv`

This is the raw data pulled from Google Sheets. It has 21 columns:

| Column | Description |
|---|---|
| Chapter | Top-level chapter name |
| Section | Section within the chapter |
| Subsection | Subsection (or topic, if no subsubsection) |
| Subsubsection | Individual topic (may be blank) |
| In Syllabus | `Yes` or `Extension` |
| Chapter/Section/Subsection/Subsubsection Filecase | URL-safe versions of the names (lowercase, hyphens) |
| PTX Path | Path to the PreTeXt source file |
| Lesson Plan Path | Path to the lesson plan PDF |
| Step By Step Guide Path | Path to the guide PDF |
| LO 1–4 | Learning objectives (up to 4 per topic) |
| Course URL | Link to the certification course on eCampus |
| PTX/Lesson Plan/Step By Step Guide Exists | `YES` or `NO` — whether the file is available |

### `website-content/data/lesson-plans-catalog.json`

Generated from the CSV. This is what the website actually reads. It organises everything into a nested hierarchy:

```
Chapters
  └── Sections (with learning objectives and course URL)
        └── Subsections
              └── Topics (with lesson plan and guide links)
```

### `website-content/data/resources-catalog.json`

This file is maintained **manually** by the project team. It lists the textbooks and training courses that appear on the Textbooks and Training Courses pages of the website.

Unlike the lesson plans catalog, this file is **not** generated by any script. To add or update a resource, edit the JSON directly and commit the change. No build step is required — the website fetches this file fresh from the repository every time a page loads, so changes are live as soon as they are pushed.

Each entry supports the following fields:

| Field | Description |
|---|---|
| `id` | Unique identifier string (e.g. `resource-3`) |
| `title` | Display title of the resource |
| `shortDescription` | Brief description shown in compact views |
| `longDescription` | Full description shown on the resource card |
| `type` | `Textbook` or `Training Course` — controls which page the resource appears on |
| `icon` | Emoji icon shown on the card |
| `link` | URL to the resource |

Example entry:
```json
{
  "id": "resource-3",
  "title": "Printable textbook, student version",
  "shortDescription": "A printable PDF version of the Grade 10 Mathematics textbook.",
  "longDescription": "A printable PDF covering the full Grade 10 Mathematics curriculum, suitable for use in classrooms without internet access.",
  "type": "Textbook",
  "icon": "📄",
  "link": "https://example.com/printable-textbook.pdf"
}
```

---

## Troubleshooting

### "credentials.json not found"
The file is not in the project folder. Ask the project maintainer to send you the `credentials.json` file, then place it in the project root (see [Step 4](#step-4--get-credentialsjson-from-the-maintainer)).

### "credentials.json.json" — double extension
Windows hid the original `.json` extension when you saved the file. In File Explorer, enable **View → Show → File name extensions**, then rename it to remove the duplicate `.json`.

### Browser opens but shows "Access blocked"
The OAuth consent screen is in "Testing" mode and your Google account hasn't been added as a test user. Contact the project maintainer and ask them to add your email address under **Google Cloud Console → APIs & Services → OAuth consent screen → Test users**.

### "Token has been expired or revoked" error
Delete `token.json` from the project root and run `node scripts/website-build.js` again. It will open the browser for a fresh authorization.

### "Port in use" — server won't start
`website-serve.js` tries multiple ports automatically. If all fail, something else is using them — close other servers or restart your computer.

### "Cannot find module 'googleapis'"
You haven't installed dependencies yet. Run `npm install` from the project root.

### "Cannot find module" for any script
Make sure you are running commands from the project root folder (the one containing `index.html`), not from inside `scripts/`.

### Validation warnings about missing learning objectives
The build still completes successfully — these are warnings, not errors. They mean some rows in the Google Sheet have empty LO columns. Check those rows in the sheet and fill them in if needed.

### No data / wrong data on the website after running the build
Make sure you also **committed and pushed** the updated `Automatic-Links.csv` and `lesson-plans-catalog.json` files to GitHub. The live website reads these files from the repository.

---

## JSON Structure

The generated catalog follows this hierarchical structure:

```json
{
  "baseUrl": "https://innodems.github.io/CBC-Grade-10-Maths/external/lesson_plans/",
  "chapters": [
    {
      "id": "numbers-and-algebra",
      "title": "Numbers and Algebra",
      "sections": [
        {
          "id": "real-numbers",
          "title": "Real Numbers",
          "learningObjectives": [
            "Classify whole numbers as odd, even, prime and composite...",
            "Determine the reciprocal of real numbers..."
          ],
          "subsections": [
            {
              "id": "classification-of-numbers",
              "title": "Classification of Numbers",
              "hasSubtopics": true,
              "topics": [
                {
                  "id": "even-and-odd-numbers",
                  "title": "Even and Odd Numbers",
                  "learningObjectiveRefs": [0],
                  "lessonPlan": {
                    "url": "https://.../even-and-odd-numbers.pdf",
                    "exists": true
                  },
                  "guide": {
                    "url": "https://.../step-by-step-guide_even-and-odd-numbers.pdf",
                    "exists": true
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

#### Key Structure Features

1. **Conditional Nesting**: Subsections can be structured in two ways:
   - **With subtopics** (`hasSubtopics: true`): Contains a `topics` array with multiple lesson plans
   - **Without subtopics** (`hasSubtopics: false`): Contains `lessonPlan` and `guide` properties directly

2. **Learning Objectives**: Stored at the section level to avoid duplication. Topics reference them using `learningObjectiveRefs` (array of indices pointing to the section's learning objectives array).

3. **File Paths**: All paths are relative to `baseUrl`. The website JavaScript combines them to create full URLs.

4. **Existence Flags**: The `exists` boolean indicates whether the PDF file is actually available (used to show "Coming Soon" messages on the site).

5. **IDs**: All chapters, sections, subsections, and topics have URL-safe IDs (lowercase, hyphens instead of spaces).

### Validation Features

The conversion script includes comprehensive validation:

- **Required columns check** - Ensures all necessary CSV columns are present
- **Typo detection** - Checks for common spelling errors in subsection and topic names
- **Data completeness** - Validates that key fields like learning objectives have values

All issues are logged with line numbers for easy fixing in the source spreadsheet.

## Architecture Notes

### Page Loading System

The website uses a single-page architecture with dynamic content loading:

1. **index.html** - Main entry point, contains navigation and page container
2. **Page templates** - Individual HTML files in `website-content/pages/`
3. **JavaScript loader** - Fetches and displays pages based on URL parameters

This allows for:
- Consistent navigation across all pages
- Faster page transitions (no full reload)
- Modular content management

### Modular Templates

Some pages use template placeholders that are populated dynamically:

- **Lesson plans pages** use a single template with chapter-specific content loaded via URL parameters
- This reduces duplication and makes maintenance easier
- See `populateChapterTemplate()` in navigation.js for implementation

### Browser Caching

The site uses smart caching to balance performance and freshness:
- Static resources (CSS, JS, JSON) are cached by the browser
- When files are updated and deployed, browsers automatically fetch new versions
- No manual cache-busting needed for normal updates

## Making Changes to the Pipeline

If you need to modify the CSV-to-JSON conversion logic:

1. Edit `scripts/csv-to-lesson-plans-json.js`
2. Test by running `node scripts/website-build.js`
3. Verify the generated JSON structure matches what the website expects
4. Update this documentation if the structure changes
5. Consider adding new validation checks for data quality

## Questions?

For technical questions about the data pipeline or website architecture, please open an issue on GitHub.

---

## Maintainer Notes — Google Cloud Console Setup

> **This section is only relevant if you ever need to recreate the Google Cloud project from scratch.** Regular users and contributors do not need to read this.

The `credentials.json` file committed to this repository was created once in Google Cloud Console. Here is how to recreate it if needed:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create or select a project
2. Go to **APIs & Services → Enabled APIs** and enable:
   - **Google Sheets API**
   - **Google Drive API**
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Fill in App name and support email; all other fields are optional
   - No scopes need to be pre-configured
4. Go to **APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Desktop app**
   - Any name (e.g. `sheets-to-csv sync`)
5. Download the resulting JSON, rename it to `credentials.json`, and commit it to the repository root
6. Update `.gitignore` to ensure `credentials.json` is **not** ignored (it is safe to commit for a read-only desktop app)

The `credentials.json` identifies the app to Google but contains no user data. Each individual user who runs the script generates their own private `token.json` via the browser authorization step.
