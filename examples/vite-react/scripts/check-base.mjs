#!/usr/bin/env node
// Proves the Vite `base` recipe (TSK-024, ADR-0033): an app mounted at /app/ needs
// `"publicPath": "/app/icons"` in its svgworm config, or every icon 404s. Builds with
// vite.base.config.ts (base /app/, svgworm.base.config.json) into dist-base/ and runs
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
  run([
    'vite',
    'build',
    '--config',
    'vite.base.config.ts',
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
