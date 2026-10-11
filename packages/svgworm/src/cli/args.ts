import { parseArgs } from 'node:util';

import type { ConfigOverrides } from '../core/api.ts';

export type ParsedArgs =
  | { readonly kind: 'help' }
  | { readonly kind: 'version' }
  | {
      readonly kind: 'build';
      readonly configFile: string | undefined;
      readonly overrides: ConfigOverrides;
      readonly isJson: boolean;
    }
  | {
      readonly kind: 'usage-error';
      readonly message: string;
      readonly isJson: boolean;
    };

const OPTIONS = {
  config: { type: 'string' },
  source: { type: 'string', multiple: true },
  'out-dir': { type: 'string' },
  'public-path': { type: 'string' },
  'module-dir': { type: 'string' },
  flatten: { type: 'boolean' },
  json: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
} as const;

export const parseCliArgs = (argv: readonly string[]): ParsedArgs => {
  const isJson = argv.includes('--json');
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      options: OPTIONS,
      allowPositionals: true,
      allowNegative: true,
    });
    if (values.help === true) return { kind: 'help' };
    if (values.version === true) return { kind: 'version' };
    const [command, ...extra] = positionals;
    if ((command !== undefined && command !== 'build') || extra.length > 0) {
      return {
        kind: 'usage-error',
        message: `unknown command "${positionals.join(' ')}". The only command is "build"`,
        isJson,
      };
    }
    return {
      kind: 'build',
      configFile: values.config,
      isJson: values.json === true,
      // Only given flags become overrides, so a flag never blanks a config value.
      overrides: {
        ...(values.source === undefined ? {} : { sources: values.source }),
        ...(values['out-dir'] === undefined
          ? {}
          : { outDir: values['out-dir'] }),
        ...(values['public-path'] === undefined
          ? {}
          : { publicPath: values['public-path'] }),
        ...(values['module-dir'] === undefined
          ? {}
          : { moduleDir: values['module-dir'] }),
        ...(values.flatten === undefined ? {} : { flatten: values.flatten }),
      },
    };
  } catch (error) {
    return {
      kind: 'usage-error',
      message: error instanceof Error ? error.message : String(error),
      isJson,
    };
  }
};
