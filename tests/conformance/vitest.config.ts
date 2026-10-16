import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'conformance',
    include: ['tests/**/*.test.ts'],
  },
});
