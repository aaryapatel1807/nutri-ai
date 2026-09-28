/**
 * NutriAI — ML service launcher (cross-platform).
 *
 * Resolves the virtualenv python for the current OS
 * (venv/Scripts on Windows, venv/bin elsewhere) and
 * starts uvicorn. Falls back to system `python` if no
 * venv exists yet (run `npm run install:all` first).
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mlDir = path.join(__dirname, '..', 'app', 'ml-service');
const venvPython =
  process.platform === 'win32'
    ? path.join(mlDir, 'venv', 'Scripts', 'python.exe')
    : path.join(mlDir, 'venv', 'bin', 'python');

const python = fs.existsSync(venvPython) ? venvPython : 'python';

if (python === 'python') {
  console.warn(
    '[nutri-ai] No virtualenv found at app/ml-service/venv — using system python.\n' +
      '           Run `npm run install:all` from the repo root to set it up.'
  );
}

const result = spawnSync(
  python,
  ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'],
  { cwd: mlDir, stdio: 'inherit', shell: process.platform === 'win32' }
);

process.exit(result.status ?? 1);
