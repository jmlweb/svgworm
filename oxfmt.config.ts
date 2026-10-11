import baseConfig from '@jmlweb/oxfmt-config-base';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    '**/dist/**',
    'pnpm-lock.yaml',
    'fixtures/**',
    'spikes/**',
    '.backlog/**',
    '.claude/**',
    // Hand-written docs keep their tables and emphasis markers.
    '**/*.md',
  ],
});
