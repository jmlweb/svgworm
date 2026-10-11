import baseConfig from '@jmlweb/vitest-config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    name: 'react',
    include: ['src/**/*.test.{ts,tsx}'],
    typecheck: {
      enabled: true,
      include: ['src/**/*.test-d.ts'],
    },
  },
});
