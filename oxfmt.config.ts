import baseConfig from '@jmlweb/oxfmt-config-base';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    '**/dist/**',
    '**/.next/**',
    'examples/*/svgworm/**',
    'pnpm-lock.yaml',
    'fixtures/**',
    // Generated output samples are byte-exact: formatting would change them.
    'docs/samples/**',
    // Snapshot files hold exact generated output.
    '**/__snapshots__/**',
    'spikes/**',
    '.backlog/**',
    '.claude/**',
    // Hand-written docs keep their tables and emphasis markers.
    '**/*.md',
  ],
});
