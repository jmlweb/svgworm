import { parseArgs } from 'node:util';

import type { ConfigOverrides } from '../core/api.ts';
import type { InitOptions } from './init/plan.ts';

import { DEFAULT_CONFIG_FILE } from '../core/config/resolve.ts';
import { defaultInitOptions, Framework } from './init/plan.ts';

export const Command = {
  BUILD: 'build',
  CHECK: 'check',
  WATCH: 'watch',
  INIT: 'init',
} as const;
export type Command = (typeof Command)[keyof typeof Command];

const COMMANDS: readonly string[] = Object.values(Command);

export type ParsedArgs =
  | { readonly kind: 'help' }
  | { readonly kind: 'version' }
  | {
      readonly kind: 'command';
      readonly command: Exclude<Command, 'init'>;
      readonly configFile: string | undefined;
      readonly overrides: ConfigOverrides;
      readonly isJson: boolean;
      /** `--verbose`: one plain line per icon, as before 0.3. */
      readonly isVerbose: boolean;
    }
  | {
      readonly kind: 'init';
      readonly options: InitOptions;
      /** `--yes`: take the defaults and flags without prompting, even on a TTY. */
      readonly isYes: boolean;
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
  verbose: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  // init only
  'component-file': { type: 'string' },
  framework: { type: 'string' },
  component: { type: 'boolean' },
  scripts: { type: 'boolean' },
  'agents-md': { type: 'boolean' },
  yes: { type: 'boolean', short: 'y' },
} as const;

const INIT_ONLY = [
  'component-file',
  'framework',
  'component',
  'scripts',
  'agents-md',
  'yes',
] as const;

const FRAMEWORKS: readonly string[] = Object.values(Framework);

const isFramework = (value: string): value is Framework =>
  FRAMEWORKS.includes(value);

const isCommand = (value: string): value is Command => COMMANDS.includes(value);

export const parseCliArgs = (argv: readonly string[]): ParsedArgs => {
  const isJson = argv.includes('--json');
  const usageError = (message: string): ParsedArgs => ({
    kind: 'usage-error',
    message,
    isJson,
  });
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
      return usageError(
        `unknown command "${positionals.join(' ')}". Commands: ${COMMANDS.join(', ')}`,
      );
    }
    const sources = values.source;
    const outDir = values['out-dir'];
    const publicPath = values['public-path'];
    const moduleDir = values['module-dir'];
    const flatten = values.flatten;

    if (command === Command.INIT) {
      const framework = values.framework;
      if (framework !== undefined && !isFramework(framework)) {
        return usageError(
          `--framework must be one of: ${FRAMEWORKS.join(', ')} (got "${framework}")`,
        );
      }
      const defaults = defaultInitOptions();
      return {
        kind: 'init',
        isYes: values.yes === true,
        isJson: values.json === true,
        options: {
          configFile: values.config ?? DEFAULT_CONFIG_FILE,
          sources: sources ?? defaults.sources,
          outDir,
          publicPath,
          moduleDir,
          flatten,
          framework,
          addScripts: values.scripts ?? defaults.addScripts,
          addComponent: values.component,
          componentFile: values['component-file'],
          addAgentsMd: values['agents-md'] ?? defaults.addAgentsMd,
        },
      };
    }

    const misplaced = INIT_ONLY.filter((flag) => values[flag] !== undefined);
    if (misplaced.length > 0) {
      return usageError(
        `--${misplaced[0] ?? ''} only applies to "svgworm init"`,
      );
    }
    return {
      kind: 'command',
      command,
      configFile: values.config,
      isJson: values.json === true,
      isVerbose: values.verbose === true,
      // Only given flags become overrides, so a flag never blanks a config value.
      overrides: {
        ...(sources === undefined ? {} : { sources }),
        ...(outDir === undefined ? {} : { outDir }),
        ...(publicPath === undefined ? {} : { publicPath }),
        ...(moduleDir === undefined ? {} : { moduleDir }),
        ...(flatten === undefined ? {} : { flatten }),
      },
    };
  } catch (error) {
    return usageError(error instanceof Error ? error.message : String(error));
  }
};
