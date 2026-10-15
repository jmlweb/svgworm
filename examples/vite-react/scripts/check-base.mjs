#!/usr/bin/env node
// Proves the Vite `base` recipe (TSK-024): with `base: '/app/'`, svgworm must write
// `--public-path /app/icons`, or every icon 404s. Builds into dist-base/ with that pair and runs
// check-dist against it. The committed output uses the default `/`, so the finally block
// rebuilds it and the script leaves the working tree as it found it.
import { execFileSync } from 'node:child_process';

const base = '/app/';
const run = (args) =>
  execFileSync('pnpm', ['exec', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

try {
  run(['svgworm', '--public-path', `${base}icons`]);
  run([
    'vite',
    'build',
    '--base',
    base,
    '--outDir',
    'dist-base',
    '--emptyOutDir',
  ]);
  execFileSync(
    process.execPath,
    ['scripts/check-dist.mjs', '--dist', 'dist-base', '--base', base],
    { stdio: 'inherit' },
  );
} finally {
  run(['svgworm']);
}
