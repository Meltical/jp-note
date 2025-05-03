const fs = require("fs");
const path = require("path");
const furigana = require("furigana-markdown-it")();
const markdownIt = require("markdown-it");

const md = markdownIt().use(furigana);

// Directories
const NOTES_DIR = path.join(__dirname, "notes");
const DIST_DIR = path.join(__dirname, "dist");
const PUBLIC_DIR = path.join(__dirname, "public");
const DIST_PUBLIC_DIR = path.join(DIST_DIR, "public");

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Error reading file: ${filePath}`, err);
    return null;
  }
}

function writeFileSafe(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
  } catch (err) {
    console.error(`Error writing file: ${filePath}`, err);
  }
}

function generatePageHtml(content, title, isHomePage = false) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="public/styles.css">
    ${isHomePage ? '<link rel="stylesheet" href="public/home.css">' : ""}
    <link rel="icon" href="public/favicon.ico" type="image/x-icon">
  </head>
  <body>
    ${content}
  </body>
  </html>`;
}

function generateHtml(markdownContent, title) {
  const content = md.render(markdownContent);
  return generatePageHtml(content, title);
}

function build() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
  }

  if (!fs.existsSync(DIST_PUBLIC_DIR)) {
    fs.mkdirSync(DIST_PUBLIC_DIR);
  }

  // Copy public assets
  fs.readdirSync(PUBLIC_DIR).forEach((file) => {
    fs.copyFileSync(
      path.join(PUBLIC_DIR, file),
      path.join(DIST_PUBLIC_DIR, file)
    );
  });

  // Generate HTML for each note
  const files = fs
    .readdirSync(NOTES_DIR)
    .filter((file) => file.endsWith(".md"));

  files.forEach((file) => {
    const noteName = path.basename(file, ".md");
    const markdownContent = readFileSafe(path.join(NOTES_DIR, file));
    if (markdownContent) {
      const htmlContent = generateHtml(markdownContent, noteName);
      writeFileSafe(path.join(DIST_DIR, `${noteName}.html`), htmlContent);
    }
  });

  // Generate index.html
  const links = files
    .map((file) => {
      const name = path.basename(file, ".md");
      return `<li><a href="${name}.html">${name}</a></li>`;
    })
    .join("");

  const content = `<h1>Notes</h1><ul>${links}</ul>`;
  const indexHtml = generatePageHtml(content, "Notes", true);

  writeFileSafe(path.join(DIST_DIR, "index.html"), indexHtml);
  console.log("Static files generated in the 'dist' directory.");
}

build();
