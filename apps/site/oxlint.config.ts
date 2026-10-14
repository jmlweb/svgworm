import reactConfig from '@jmlweb/oxlint-config-react';
import { defineConfig } from 'oxlint';

// Nested config: the site renders React to static HTML, it is not a Node package.
export default defineConfig({
  extends: [reactConfig],
  ignorePatterns: ['dist/**', '.astro/**', 'svgworm/**', 'public/**'],
  overrides: [
    {
      // The check script is a Node CLI: it prints and sets the exit code.
      files: ['scripts/**'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
});
