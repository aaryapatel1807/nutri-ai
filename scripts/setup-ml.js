/**
 * NutriAI — ML service setup (cross-platform).
 *
 * Creates app/ml-service/venv and installs requirements.txt
 * using the venv's own pip, on Windows, macOS and Linux.
 */
const { execSync } = require('child_process');
const path = require('path');

const mlDir = path.join(__dirname, '..', 'app', 'ml-service');
const venvDir = path.join(mlDir, 'venv');
const pip =
  process.platform === 'win32'
    ? `"${path.join(venvDir, 'Scripts', 'pip')}"`
    : `"${path.join(venvDir, 'bin', 'pip')}"`;

console.log('[nutri-ai] Creating Python virtual environment...');
execSync(`python -m venv "${venvDir}"`, { stdio: 'inherit' });

console.log('[nutri-ai] Installing ML service requirements...');
execSync(`${pip} install -r requirements.txt`, {
  cwd: mlDir,
  stdio: 'inherit',
  shell: true,
});

console.log('[nutri-ai] ML service setup complete.');
