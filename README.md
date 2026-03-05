# CBC Kenya Mathematics

A free, interactive textbook and resource hub for Grade 10 CBC Mathematics. This project provides interactive lessons, exercises, lesson plans, guides, and training courses supporting Kenya's Competency-Based Curriculum.

## 🚀 Quick Start

### View the Website

Visit: [https://smbor.github.io/cbckenyamathematics/](https://smbor.github.io/cbckenyamathematics/) *(or your deployed URL)*

### Local Development

1. Clone this repository
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the local server:
   ```powershell
   node scripts/website-serve.js
   ```
4. The site opens automatically at http://localhost:8080

**Note:** The site uses `fetch()` for dynamic content loading, so a web server is required (opening `index.html` directly won't work).

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions including Google Sheets sync.

## 📚 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide for editing content, design, and making contributions
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Technical details, data pipeline, and architecture
- **[docs/](docs/)** - Additional documentation (placeholder for future expansion)

## 🎯 Features

- **Interactive Textbook** - Free, web-based Grade 10 mathematics textbook
- **Lesson Plans** - Comprehensive curriculum-aligned lesson plans
- **Step-by-Step Guides** - Detailed teaching guides for educators
- **Training Courses** - Professional development resources for teachers
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## 🏗️ Project Structure

```
cbckenyamathematics/
├── index.html                    # Main entry point
├── website-content/
│   ├── pages/                   # Page templates
│   ├── css/                     # Stylesheets
│   ├── js/                      # JavaScript (navigation, dynamic loading)
│   ├── data/                    # JSON/CSV catalogs
│   └── images/                  # Logos, icons, screenshots
├── scripts/
│   ├── website-build.js         # Full pipeline: Sheets → CSV → JSON
│   ├── website-serve.js         # Local preview server
│   ├── sheets-to-csv.js         # Google Sheets → Automatic-Links.csv
│   └── csv-to-lesson-plans-json.js  # CSV → lesson-plans-catalog.json
├── docs/                        # Documentation
├── CONTRIBUTING.md              # Contributor guide
└── DEVELOPMENT.md               # Developer guide (setup & pipeline)
```

## 🔄 Updating Lesson Plans

The lesson plans catalog is automatically synced from Google Sheets. See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.

**Quick version (after first-time setup):**
```powershell
node scripts/website-build.js
```
This pulls the latest data from Google Sheets and regenerates the website catalog in one step.

## 📄 License

This work is licensed under a [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

You are free to:
- **Share** - Copy and redistribute the material
- **Adapt** - Remix, transform, and build upon the material

As long as you give appropriate credit and indicate if changes were made.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Editing content and design
- Adding images
- Testing changes locally
- Submitting pull requests

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the project maintainers.

## 📝 To Do

- Complete the contributors list in the Project Overview page
- Add other versions of the textbook to `website-content/data/resources-catalog.json`

