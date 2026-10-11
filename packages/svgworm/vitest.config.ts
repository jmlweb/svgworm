import baseConfig from '@jmlweb/vitest-config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'svgworm',
    include: ['src/**/*.test.ts'],
    typecheck: { enabled: true, include: ['src/**/*.test-d.ts'] },
  },
});
