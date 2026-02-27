/**
 * Website Local Server
 *
 * Serves the website locally so you can preview it in your browser.
 * The site must be served (not opened as a plain file) because it loads
 * content dynamically via JavaScript.
 *
 * Method 1 (primary):  Built-in Node.js static server — no install needed
 * Method 2 (fallback): Python http.server — if Node somehow cannot bind to any port
 *
 * Usage: node scripts/website-serve.js
 *
 * Press Ctrl+C to stop the server.
 */

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { exec, execSync } = require('child_process');

// ─── Configuration ────────────────────────────────────────────────────────────

// The website root is the project root (where index.html lives)
const SERVE_ROOT  = path.join(__dirname, '..');

// Try these ports in order until one is free
const PORTS_TO_TRY = [8080, 8081, 8082, 3000, 3001];

// MIME types for all file extensions used in this project
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv':  'text/csv; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.pdf':  'application/pdf',
    '.txt':  'text/plain; charset=utf-8',
    '.md':   'text/plain; charset=utf-8',
};

const DIVIDER = '─'.repeat(60);

// ─── Open browser ─────────────────────────────────────────────────────────────

function openBrowser(url) {
    // 'start' is the Windows command to open the default browser
    exec(`start "" "${url}"`, err => {
        if (err) {
            console.log(`   Could not open browser automatically.`);
            console.log(`   Please open manually: ${url}`);
        }
    });
}

// ─── Request handler ──────────────────────────────────────────────────────────

function handleRequest(req, res) {
    // Strip query strings and decode URI (e.g. %20 → space)
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    // Default to index.html for the root path
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(SERVE_ROOT, urlPath);

    // Security check: make sure the resolved path is inside the project folder
    if (!filePath.startsWith(SERVE_ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found — return a simple 404 page
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`<h2>404 — Not found</h2><p>${urlPath}</p>`);
            } else {
                res.writeHead(500);
                res.end('Server error: ' + err.message);
            }
            return;
        }

        const ext      = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

// ─── Try to start the Node.js server ─────────────────────────────────────────

function tryNodeServer(ports) {
    if (ports.length === 0) {
        console.warn('⚠️  All Node.js ports are in use. Trying Python fallback...\n');
        tryPythonServer();
        return;
    }

    const port   = ports[0];
    const server = http.createServer(handleRequest);

    server.listen(port, '127.0.0.1', () => {
        const url = `http://localhost:${port}`;
        console.log('\n' + DIVIDER);
        console.log('  🌐  CBC Kenya Mathematics — Local Preview');
        console.log(DIVIDER);
        console.log(`\n  ✅  Server running at: ${url}`);
        console.log('\n  Opening your browser now...');
        console.log('\n  Press Ctrl+C to stop.\n');
        console.log(DIVIDER + '\n');
        openBrowser(url);
    });

    server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
            console.log(`   Port ${port} is in use, trying ${ports[1] || 'Python fallback'}...`);
            server.close();
            tryNodeServer(ports.slice(1));
        } else {
            console.error('❌ Server error:', err.message);
            console.log('Trying Python fallback...\n');
            tryPythonServer();
        }
    });
}

// ─── Python fallback ─────────────────────────────────────────────────────────

function tryPythonServer() {
    // Detect whether the system has 'python' or 'python3'
    let pythonCmd = null;

    for (const cmd of ['python', 'python3']) {
        try {
            const version = execSync(`${cmd} --version 2>&1`, { timeout: 3000 }).toString();
            if (version.toLowerCase().includes('python')) {
                pythonCmd = cmd;
                break;
            }
        } catch (_) {
            // Not found, try next
        }
    }

    if (!pythonCmd) {
        console.error(DIVIDER);
        console.error('❌ Could not start a local server.');
        console.error('   All Node.js ports are busy and Python is not available.\n');
        console.error('   Options:');
        console.error('   1. Close any other servers and re-run this script.');
        console.error('   2. Install Python from https://python.org');
        console.error('   3. Install http-server:  npm install -g http-server');
        console.error('      Then run:             http-server . -p 8080 -o');
        console.error(DIVIDER + '\n');
        process.exit(1);
    }

    const port = 8080;
    const url  = `http://localhost:${port}`;

    console.log(DIVIDER);
    console.log('  🌐  CBC Kenya Mathematics — Local Preview (Python)');
    console.log(DIVIDER);
    console.log(`\n  ✅  Starting Python server at: ${url}`);
    console.log('\n  Opening your browser now...');
    console.log('\n  Press Ctrl+C to stop.\n');
    console.log(DIVIDER + '\n');

    // Change to project root, then start Python's built-in HTTP server
    const child = exec(
        `cd /d "${SERVE_ROOT}" && ${pythonCmd} -m http.server ${port}`,
        err => {
            if (err && err.signal !== 'SIGINT') {
                console.error('❌ Python server exited unexpectedly:', err.message);
            }
        }
    );

    // Show Python server output in the terminal
    child.stdout.on('data', d => process.stdout.write(d));
    child.stderr.on('data', d => process.stderr.write(d));

    // Give Python a moment to start, then open the browser
    setTimeout(() => openBrowser(url), 1000);

    // Forward Ctrl+C cleanly
    process.on('SIGINT', () => {
        child.kill();
        console.log('\nServer stopped.');
        process.exit(0);
    });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

console.log('\n🔍 Starting local server...');
console.log(`   Serving from: ${SERVE_ROOT}`);
tryNodeServer(PORTS_TO_TRY);
