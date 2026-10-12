import { parseArgs } from 'node:util';

import type { ConfigOverrides } from '../core/api.ts';

export const Command = {
  BUILD: 'build',
  CHECK: 'check',
  WATCH: 'watch',
} as const;
export type Command = (typeof Command)[keyof typeof Command];

const COMMANDS: readonly string[] = Object.values(Command);

export type ParsedArgs =
  | { readonly kind: 'help' }
  | { readonly kind: 'version' }
  | {
      readonly kind: 'command';
      readonly command: Command;
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

const isCommand = (value: string): value is Command => COMMANDS.includes(value);

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
    const [command = Command.BUILD, ...extra] = positionals;
    if (!isCommand(command) || extra.length > 0) {
      return {
        kind: 'usage-error',
        message: `unknown command "${positionals.join(' ')}". Commands: ${COMMANDS.join(', ')}`,
        isJson,
      };
    }
    return {
      kind: 'command',
      command,
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
