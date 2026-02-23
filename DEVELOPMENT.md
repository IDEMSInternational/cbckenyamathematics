# Development Guide

This guide explains the technical details of the CBC Kenya Mathematics website, particularly the lesson plans data pipeline.

## Lesson Plans Data Pipeline

### Overview

The lesson plans catalog on the website is automatically generated from CSV files exported from Google Sheets. This ensures the website stays in sync with the curriculum planning documents.

**Data Flow:**
```
Google Sheets → CSV Export → Conversion Script → JSON Catalog → Website Display
```

### The Data Files

**Input Files (in `website-content/data/`):**
- **book-structure.csv** — Lesson plan metadata including:
  - Chapter, section, subsection, and topic hierarchy
  - Lesson names and learning objectives
  - Status flags (textbook ready, lesson plan status, guide status)
  
- **file-matching.csv** — File information including:
  - URL-safe IDs for each hierarchy level
  - File paths for lesson plans and step-by-step guides
  - Existence flags (whether PDFs are available)

**Output File:**
- **lesson-plans-catalog.json** — Structured catalog that the website uses to display all lesson plans in a hierarchical, navigable format

### Updating the Lesson Plans Catalog

#### Prerequisites

You need Node.js installed on your computer. Check if you have it:

```bash
node --version
```

If you don't see a version number, [download and install Node.js](https://nodejs.org/).

#### Step 1: Export the Latest Data from Google Sheets

1. Open the "Book and Lesson Plan Structure" Google Sheet
2. Go to **File → Download → Comma Separated Values (.csv)**
3. Export the **"New Book Structure"** tab and save it as `book-structure.csv`
4. Export the **"File Matching"** tab and save it as `file-matching.csv`
5. Place both files in the `website-content/data/` folder (replacing the old ones)

#### Step 2: Run the Conversion Script

Open a terminal/command prompt in the project folder and run:

```bash
node scripts/csv-to-lesson-plans-json.js
```

**Windows PowerShell:**

```powershell
node .\scripts\csv-to-lesson-plans-json.js
```

#### Step 3: Verify the Output

You should see output like:
```
📖 Reading CSV files...
📊 Parsing CSV data...
   Book structure: 130 rows
   File matching: 130 rows

🔍 Validating data...
   ✓ All validation checks passed

🔨 Building lesson plans catalog...
   Generated 3 chapters
   - Numbers and Algebra: 4 sections
   - Measurements and Geometry: 10 sections
   - Statistics and Probability: 2 sections

💾 Writing JSON file...
✅ Conversion completed successfully!
```

The script validates the data and reports any issues:
- **Errors** (red) - Critical issues that prevent generation
- **Warnings** (yellow) - Inconsistencies that should be reviewed

### JSON Structure

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
- **Learning objectives consistency** - Compares LOs between book-structure.csv and file-matching.csv
- **Typo detection** - Checks for common spelling errors
- **Data completeness** - Validates that key fields have values

All issues are logged with line numbers for easy fixing in the source spreadsheet.

### Troubleshooting

**"Cannot find module" error:**
- Make sure you're running the command from the project root folder (where `scripts/` is visible)

**"No such file or directory" error:**
- Check that both CSV files exist in `website-content/data/`
- Check that the filenames are exactly `book-structure.csv` and `file-matching.csv`

**Validation errors:**
- Review the console output for specific issues and line numbers
- Fix issues in the Google Sheet and re-export
- The script will not generate JSON if critical errors are found

**Empty or incorrect JSON output:**
- Open the CSV files and verify they have the expected column headers
- Make sure there are no extra blank lines at the top of the CSV files
- Check that the CSV exports didn't change the column structure

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
2. Test with your actual CSV files
3. Verify the generated JSON structure matches what the website expects
4. Update this documentation if the structure changes
5. Consider adding new validation checks for data quality

## Questions?

For technical questions about the data pipeline or website architecture, please open an issue on GitHub.
