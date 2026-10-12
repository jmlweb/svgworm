import reactConfig from '@jmlweb/oxlint-config-react';
import { defineConfig } from 'oxlint';

// Nested config: the example is a React app, not a Node package.
export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: ['.next/**', 'next-env.d.ts', 'svgworm/**', 'public/**'],
  overrides: [
    {
      // Next.js reads config files and App Router files through default exports.
      files: ['*.config.{ts,mts,cts}', 'app/**/*.tsx'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      // The check script is a Node CLI: it prints and sets the exit code.
      files: ['scripts/**'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
});
