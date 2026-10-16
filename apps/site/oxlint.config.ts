import reactConfig from '@jmlweb/oxlint-config-react';
import { defineConfig } from 'oxlint';

// Nested config: the site renders React to static HTML, it is not a Node package.
export default defineConfig({
  extends: [reactConfig],
  // Astro.props and friends exist in the frontmatter of every .astro file.
  globals: { Astro: 'readonly' },
  ignorePatterns: ['dist/**', '.astro/**', 'svgworm/**', 'public/**'],
  overrides: [
    {
      // The check script is a Node CLI: it prints and sets the exit code.
      files: ['scripts/**'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
    {
      // Workers load the module's default export (ADR-0032).
      files: ['worker/**'],
      rules: { 'import/no-default-export': 'off' },
    },
  ],
});
