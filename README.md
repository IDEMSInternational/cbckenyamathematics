# CBC Kenya Mathematics

A free, interactive textbook and resource hub for Grade 10 CBC Mathematics. This project provides interactive lessons, exercises, lesson plans, guides, and training courses supporting Kenya's Competency-Based Curriculum.

## 🚀 Quick Start

### View the Website

Visit: [https://smbor.github.io/cbckenyamathematics/](https://smbor.github.io/cbckenyamathematics/) *(or your deployed URL)*

### Local Development

1. Clone this repository
2. Install a local web server:
   ```bash
   npm install -g http-server
   ```
3. Start the server:
   ```bash
   http-server -p 8000
   ```
4. Open http://localhost:8000 in your browser

**Note:** The site uses `fetch()` for dynamic content loading, so a web server is required (opening `index.html` directly won't work).

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
├── index.html                # Main entry point
├── website-content/
│   ├── pages/               # Page templates
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript (navigation, dynamic loading)
│   ├── data/                # JSON/CSV catalogs
│   └── images/              # Logos, icons, screenshots
├── scripts/                 # Build scripts (CSV-to-JSON converter)
├── docs/                    # Documentation
├── CONTRIBUTING.md          # Contributor guide
└── DEVELOPMENT.md           # Developer guide
```

## 🔄 Updating Lesson Plans

The lesson plans catalog is automatically generated from CSV files. See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed instructions.

**Quick version:**
1. Export CSVs from Google Sheets
2. Run: `node scripts/csv-to-lesson-plans-json.js`
3. The script generates `website-content/data/lesson-plans-catalog.json`

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

