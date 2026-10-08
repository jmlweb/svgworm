import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

const coreBoundary = {
  paths: [
    { name: '@clack/prompts', message: 'src/core must not depend on CLI UX (architecture.md).' },
    { name: 'react', message: 'src/core must not depend on any UI framework (architecture.md).' },
  ],
  patterns: [
    { group: ['react/*', '@clack/prompts/*'], message: 'src/core must stay UI-free.' },
    {
      group: ['**/cli', '**/cli/**'],
      message: 'src/core must not import src/cli. The CLI consumes the core, never the reverse.',
    },
  ],
}

export default defineConfig(
  { ignores: ['**/dist/', '**/node_modules/', 'fixtures/', 'spikes/', '.claude/', '.backlog/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.config.ts', 'packages/*/vitest.config.ts'] },
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
    },
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { process: 'readonly', URL: 'readonly' } },
  },
  {
    files: ['**/*.config.ts', 'eslint.config.mjs'],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    // The core reports through an event callback; it never touches the terminal.
    files: ['packages/svgworm/src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', coreBoundary],
      'no-console': 'error',
      'no-restricted-properties': [
        'error',
        { object: 'process', property: 'stdout', message: 'src/core must not write to stdout.' },
        { object: 'process', property: 'stderr', message: 'src/core must not write to stderr.' },
      ],
    },
  },
  {
    // The adapter consumes the generated output only (ADR-0002, ADR-0008).
    files: ['packages/react/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'svgworm', message: '@svgworm/react must not import svgworm.' }],
          patterns: [{ group: ['svgworm/*'], message: '@svgworm/react must not import svgworm.' }],
        },
      ],
    },
  },
)
