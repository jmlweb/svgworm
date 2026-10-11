import baseConfig from '@jmlweb/oxfmt-config-base';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    '**/dist/**',
    'pnpm-lock.yaml',
    'fixtures/**',
    // Generated output samples are byte-exact: formatting would change them.
    'docs/samples/**',
    'spikes/**',
    '.backlog/**',
    '.claude/**',
    // Hand-written docs keep their tables and emphasis markers.
    '**/*.md',
  ],
});
