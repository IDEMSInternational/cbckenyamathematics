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
