// fix_imports.js
// Adjust relative import paths after moving the project into the top‑level `app/` folder.
// It prefixes an extra "../" to imports that start with "../../../".

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // app/frontend

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      walk(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const newContent = content.replace(/(['"])\.\.\/\.\.\/(.+?)\1/g, (m, q, rest) => `${q}../..${q}${rest}`);
      // Simpler replacement: prepend "../" before the existing "../../../"
      const updated = content.replace(/(['"])\.\.\/\.\.\//g, (m, q) => `${q}../${m.slice(1)}`);
      if (updated !== content) {
        fs.writeFileSync(full, updated, 'utf8');
        console.log(`Updated ${path.relative(ROOT, full)}`);
      }
    }
  }
}

walk(ROOT);
console.log('Import path fix completed.');
