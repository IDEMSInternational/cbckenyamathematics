# CBC Kenya Mathematics

## About

This repository contains educational materials for mathematics in Kenya following the Competency-Based Curriculum (CBC).

## License

This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.

## Editing the site (step‑by‑step)

### 1) Where to edit content

- **Home page content**: [website-content/pages/home.html](website-content/pages/home.html)
- **About page**: [website-content/pages/about.html](website-content/pages/about.html)
- **Resources page**: [website-content/pages/resources.html](website-content/pages/resources.html)

### 2) Where to edit design (look & feel)

- **Global styles (colors, spacing, typography)**: [website-content/css/styles.css](website-content/css/styles.css)
- **Navigation styles (top menu)**: [website-content/css/navigation.css](website-content/css/navigation.css)
- **Navigation behavior (mobile menu)**: [website-content/js/navigation.js](website-content/js/navigation.js)

### 3) Add or change images

1. Put image files in [website-content/images/](website-content/images/).
2. Use **this path format** in `home.html`:
	- `website-content/images/...`
3. For `about.html` and `resources.html`, you can use normal relative paths like:
	- `../images/...`

### 4) Preview your changes locally

The homepage loads content with `fetch()`, so you **must** use a local web server (opening `index.html` directly won’t work).

#### Step A — Install the preview server (once)

```bash
npm install -g http-server
```

**Windows PowerShell note (if you get an execution policy error):**

```bash
& "C:\Program Files\nodejs\npm.cmd" install -g http-server
```

#### Step B — Start the server (every time you want to preview)

```bash
http-server -p 8000
```

**Windows PowerShell note (if the run step fails):**

```bash
& "$env:APPDATA\npm\http-server.cmd" -p 8000
```

#### Step C — Open the site in your browser

Open: http://localhost:8000/

### 5) If you don’t see changes

- Press **Ctrl + F5** (hard refresh).
- If images don’t load, double‑check the file path in the HTML.
---

## Lesson Plans Data Pipeline

### What This Is For

The lesson plans catalog on the website is generated from two CSV files that are exported from Google Sheets. This pipeline converts those CSV files into a structured JSON file that the website reads and displays.

**The two CSV files contain:**
- **book-structure.csv** — The lesson plan metadata (chapter names, sections, learning objectives, status flags)
- **file-matching.csv** — The actual file paths for lesson plans and guides, plus whether they exist

**The output is:**
- **lesson-plans-catalog.json** — A structured catalog that the website uses to display all lesson plans in a hierarchical format

### How to Update the Lesson Plans Catalog

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

**Windows PowerShell alternative:**

```powershell
node .\scripts\csv-to-lesson-plans-json.js
```

#### Step 3: Verify the Output

You should see output like:
```
Successfully parsed 130 rows from book-structure.csv
Successfully parsed 130 rows from file-matching.csv
Successfully generated lesson-plans-catalog.json with X chapters
```

The script creates/updates `website-content/data/lesson-plans-catalog.json`.

### JSON Structure Explained

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
          "id": "classification-of-numbers",
          "title": "Classification of Numbers",
          "learningObjectives": [
            "Objective 1 text...",
            "Objective 2 text..."
          ],
          "subsections": [
            {
              "id": "natural-numbers",
              "title": "Natural Numbers",
              "hasSubtopics": true,
              "topics": [
                {
                  "id": "introduction-to-natural-numbers",
                  "title": "Introduction to Natural Numbers",
                  "lessonPlan": {
                    "path": "Numbers and Algebra/Classification of Natural Numbers/Natural Numbers/Introduction to Natural Numbers - LP.pdf",
                    "exists": true
                  },
                  "guide": {
                    "path": "Numbers and Algebra/.../Guide.pdf",
                    "exists": false
                  },
                  "learningObjectiveRefs": [0, 1]
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

#### Key Structure Features:

1. **Conditional Nesting**: Subsections can be structured in two ways:
   - **With subtopics** (`hasSubtopics: true`): Contains a `topics` array with multiple lesson plans
   - **Without subtopics** (`hasSubtopics: false`): Contains `lessonPlan` and `guide` properties directly

2. **Learning Objectives**: Stored at the section level to avoid duplication. Topics reference them using `learningObjectiveRefs` (array of indices).

3. **File Paths**: All paths are relative to `baseUrl`. The website combines them to create full URLs.

4. **Existence Flags**: The `exists` boolean indicates whether the PDF file is actually available (used to show "Coming Soon" messages).

5. **IDs**: All chapters, sections, subsections, and topics have URL-safe IDs (lowercase, hyphens instead of spaces).

### Troubleshooting

**"Cannot find module" error:**
- Make sure you're running the command from the project root folder (where `scripts/` is visible)

**"No such file or directory" error:**
- Check that both CSV files exist in `website-content/data/`
- Check that the filenames are exactly `book-structure.csv` and `file-matching.csv`

**Empty or incorrect JSON output:**
- Open the CSV files and verify they have the expected column headers
- Make sure there are no extra blank lines at the top of the CSV files
- Check that the CSV exports didn't change the column structure