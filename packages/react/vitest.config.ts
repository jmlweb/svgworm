import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'react',
    include: ['src/**/*.test.{ts,tsx}'],
    // No component exists yet (TSK-012); drop this once the first test lands.
    passWithNoTests: true,
    typecheck: { enabled: true, include: ['src/**/*.test-d.ts'], passWithNoTests: true },
  },
})
