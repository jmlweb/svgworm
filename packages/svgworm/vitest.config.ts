import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'svgworm',
    include: ['src/**/*.test.ts'],
    typecheck: { enabled: true, include: ['src/**/*.test-d.ts'] },
  },
})
