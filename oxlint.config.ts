import nodeConfig from '@jmlweb/oxlint-config-node';
import { defineConfig } from 'oxlint';

// Core boundary (architecture.md, ADR-0008): the core is UI-free and silent.
// It reports progress through an event callback and never touches the terminal.
const coreImportBoundary = [
  'error',
  {
    paths: [
      {
        name: '@clack/prompts',
        message: 'src/core must not depend on CLI UX (architecture.md).',
      },
      {
        name: 'react',
        message:
          'src/core must not depend on any UI framework (architecture.md).',
      },
      {
        name: 'process',
        message:
          'src/core must not touch the process streams. Use the event callback.',
      },
      {
        name: 'node:process',
        message:
          'src/core must not touch the process streams. Use the event callback.',
      },
    ],
    patterns: [
      {
        group: ['react/*', '@clack/prompts/*'],
        message: 'src/core must stay UI-free.',
      },
      {
        group: ['**/cli', '**/cli/**'],
        message:
          'src/core must not import src/cli. The CLI consumes the core, never the reverse.',
      },
    ],
  },
];

export default defineConfig({
  extends: [nodeConfig],
  // Oxlint ignores `options` in extended configs: this must stay in the root file.
  options: { typeAware: true },
  // `bin` and `files` in package.json point at dist/: map sources to build output.
  settings: {
    n: {
      convertPath: [
        {
          include: ['src/**/*.ts'],
          replace: ['^src/(.+)\\.ts$', 'dist/$1.js'],
        },
      ],
    },
  },
  ignorePatterns: [
    '**/dist/**',
    '**/.next/**',
    'examples/*/svgworm/**',
    'evals/agent/fixture/**',
    'fixtures/**',
    // Snapshot files hold exact generated output.
    '**/__snapshots__/**',
    // Generated output samples: their shape is fixed by the output contract.
    'docs/samples/**',
    'spikes/**',
    '.claude/**',
    '.backlog/**',
    '.husky/**',
  ],
  overrides: [
    {
      // Config files default-export by tool contract.
      files: ['**/*.config.{ts,mts,cts}'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      // The CLI is the only place that talks to the terminal, and it is a bin.
      files: ['packages/svgworm/src/cli/**'],
      rules: { 'n/no-process-exit': 'off' },
    },
    {
      // These scripts and the bin shim import build output that does not exist at lint time.
      files: ['scripts/**', 'packages/*/bin/**', 'evals/**/*.mjs'],
      rules: { 'n/no-missing-import': 'off' },
    },
    {
      files: ['packages/svgworm/src/core/**/*.ts'],
      rules: {
        'eslint/no-restricted-imports': coreImportBoundary,
        'eslint/no-console': 'error',
        // `process.stdout` / `process.stderr` cannot be matched by member, so the whole
        // `process` global is off limits in the core.
        'eslint/no-restricted-globals': [
          'error',
          {
            name: 'process',
            message:
              'src/core must not use process (no stdout/stderr). Use the event callback.',
          },
          {
            name: 'console',
            message: 'src/core must not write to the terminal.',
          },
        ],
      },
    },
  ],
});
