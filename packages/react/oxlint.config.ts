import reactConfig from '@jmlweb/oxlint-config-react';
import { defineConfig } from 'oxlint';

// Nested config: Oxlint uses the nearest one, so this replaces the root rules for this package.
// `options.typeAware` is only read from the root config, which is where it is set.
export default defineConfig({
  extends: [reactConfig],
  overrides: [
    {
      // Config files default-export by tool contract.
      files: ['*.config.{ts,mts,cts}'],
      rules: { 'import/no-default-export': 'off' },
    },
    {
      // The adapter consumes the generated output only (ADR-0002, ADR-0008).
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        'eslint/no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'svgworm',
                message: '@svgworm/react must not import svgworm.',
              },
            ],
            patterns: [
              {
                group: ['svgworm/*'],
                message: '@svgworm/react must not import svgworm.',
              },
            ],
          },
        ],
      },
    },
  ],
});
