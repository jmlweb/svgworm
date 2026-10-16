import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
      'apps/site/vitest.config.ts',
      'tests/conformance/vitest.config.ts',
    ],
  },
});
