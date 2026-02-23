# Contributing to CBC Kenya Mathematics

Thank you for your interest in contributing to the CBC Kenya Mathematics project! This guide will help you edit the website and make contributions.

## Quick Start

1. Clone or download this repository
2. Set up a local web server (see [Preview Changes Locally](#preview-changes-locally))
3. Make your edits
4. Test locally
5. Submit your changes

## Editing the Site

### Where to Edit Content

- **Home page content**: [website-content/pages/home.html](website-content/pages/home.html)
- **About page**: [website-content/pages/about.html](website-content/pages/about.html)
- **Lesson plans template**: [website-content/pages/resources-lesson-plans.html](website-content/pages/resources-lesson-plans.html)
- **Textbooks page**: [website-content/pages/resources-textbooks.html](website-content/pages/resources-textbooks.html)
- **Training courses page**: [website-content/pages/resources-training.html](website-content/pages/resources-training.html)

### Where to Edit Design (Look & Feel)

- **Global styles** (colors, spacing, typography): [website-content/css/styles.css](website-content/css/styles.css)
- **Navigation styles** (top menu): [website-content/css/navigation.css](website-content/css/navigation.css)
- **Navigation behavior** (mobile menu, page loading): [website-content/js/navigation.js](website-content/js/navigation.js)

### Adding or Changing Images

1. Put image files in [website-content/images/](website-content/images/)
2. Organize by type:
   - `logos/` - Organizational logos
   - `icons/` - UI icons
   - `screenshots/` - Screenshots of resources
3. Use the appropriate path format:
   - In `home.html`: `website-content/images/...`
   - In other pages (about.html, resources pages): `../images/...`

**Image Guidelines:**
- Use optimized images for web (compressed without significant quality loss)
- Recommended formats: PNG for logos/icons, JPG for photos
- Include descriptive alt text for all images in HTML

## Preview Changes Locally

The homepage loads content with `fetch()`, so you **must** use a local web server (opening `index.html` directly won't work).

### Step 1 — Install the preview server (one time only)

```bash
npm install -g http-server
```

**Windows PowerShell note (if you get an execution policy error):**

```powershell
& "C:\Program Files\nodejs\npm.cmd" install -g http-server
```

### Step 2 — Start the server (each time you preview)

```bash
http-server -p 8000
```

**Windows PowerShell note (if the command fails):**

```powershell
& "$env:APPDATA\npm\http-server.cmd" -p 8000
```

### Step 3 — Open the site in your browser

Navigate to: http://localhost:8000/

### Troubleshooting

**Changes not showing up?**
- Press **Ctrl + F5** (hard refresh) to clear browser cache
- If images don't load, double-check the file path in the HTML
- Check the browser console (F12) for any error messages

## Working with Lesson Plans Data

If you need to update the lesson plans catalog, see [DEVELOPMENT.md](DEVELOPMENT.md) for details on the data pipeline.

## Submitting Changes

1. Create a new branch for your changes
2. Make your edits and test them locally
3. Commit your changes with clear, descriptive commit messages
4. Push your branch and create a pull request
5. Describe what you changed and why

## Code Style

- Use consistent indentation (2 spaces for HTML/CSS/JS)
- Write descriptive comments for complex functionality
- Keep lines reasonably short (under 120 characters when practical)
- Use semantic HTML elements
- Follow existing naming conventions

## Questions?

If you have questions or need help, please open an issue on GitHub or contact the project maintainers.
