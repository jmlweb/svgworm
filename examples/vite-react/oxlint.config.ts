import reactConfig from '@jmlweb/oxlint-config-react';
import { defineConfig } from 'oxlint';

// Nested config: the example is a React app, not a Node package.
export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: ['dist/**', 'dist-base/**', 'svgworm/**', 'public/**'],
  overrides: [
    {
      // Vite reads its config through the default export.
      files: ['*.config.{ts,mts,cts}'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      // The check scripts are Node CLIs: they print and set the exit code.
      files: ['scripts/**'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
});
