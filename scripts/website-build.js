/**
 * Website Build Script
 *
 * Runs the full pipeline to build the website from Google Sheets:
 *   Step 1: Pull latest data from Google Sheets → Automatic-Links.csv
 *   Step 2: Convert Automatic-Links.csv → lesson-plans-catalog.json
 *
 * Usage: node scripts/website-build.js
 */

const { spawnSync } = require('child_process');
const path = require('path');

// All scripts are relative to this file's directory (scripts/)
const SCRIPTS = [
    {
        label: 'Step 1/2 — Syncing Google Sheets → Automatic-Links.csv',
        file: path.join(__dirname, 'sheets-to-csv.js'),
    },
    {
        label: 'Step 2/2 — Converting CSV → lesson-plans-catalog.json',
        file: path.join(__dirname, 'csv-to-lesson-plans-json.js'),
    }
];

const DIVIDER = '─'.repeat(60);

console.log('\n' + DIVIDER);
console.log('  🏗️  CBC Kenya Mathematics — Website Build');
console.log(DIVIDER + '\n');

let allPassed = true;

for (const script of SCRIPTS) {
    console.log(`📌 ${script.label}`);
    console.log(DIVIDER);

    // Run the script as a child process, inheriting stdio so its output
    // appears directly in this terminal (no buffering)
    const result = spawnSync('node', [script.file], { stdio: 'inherit' });

    if (result.status !== 0) {
        console.error(`\n❌ Build failed at: ${path.basename(script.file)}`);
        console.error('   Fix the error above and re-run this script.\n');
        allPassed = false;
        break;
    }

    console.log();  // blank line between steps
}

if (allPassed) {
    console.log(DIVIDER);
    console.log('✅ Build complete! The website is ready.');
    console.log('   Run   node scripts/website-serve.js   to preview it locally.');
    console.log(DIVIDER + '\n');
}
