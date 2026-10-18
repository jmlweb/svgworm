import { parseArgs } from 'node:util';

import type { ConfigOverrides } from '../core/api.ts';
import type { InitOptions } from './init/plan.ts';

import { DEFAULT_CONFIG_FILE } from '../core/config/resolve.ts';
import { CrossOrigin } from '../core/config/schema.ts';
import { defaultInitOptions, Framework } from './init/plan.ts';
import { didYouMean, suggestClosest } from './suggest.ts';

export const Command = {
  BUILD: 'build',
  CHECK: 'check',
  WATCH: 'watch',
  INIT: 'init',
  MIGRATE: 'migrate',
} as const;
export type Command = (typeof Command)[keyof typeof Command];

const COMMANDS: readonly string[] = Object.values(Command);

export const MigrateTarget = {
  SVGR: 'svgr',
} as const;
export type MigrateTarget = (typeof MigrateTarget)[keyof typeof MigrateTarget];

const MIGRATE_TARGETS: readonly string[] = Object.values(MigrateTarget);

const isMigrateTarget = (value: string): value is MigrateTarget =>
  MIGRATE_TARGETS.includes(value);

export type ParsedArgs =
  | { readonly kind: 'help' }
  | { readonly kind: 'version' }
  | {
      readonly kind: 'command';
      readonly command: Exclude<Command, 'init' | 'migrate'>;
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
      readonly kind: 'migrate';
      readonly target: MigrateTarget;
      readonly configFile: string | undefined;
      readonly overrides: ConfigOverrides;
      readonly isJson: boolean;
      /** `--write`: change the files. Without it, a dry run. */
      readonly isWrite: boolean;
      readonly componentFile: string | undefined;
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
  'cross-origin': { type: 'string' },
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
  'cdn-url': { type: 'string' },
  yes: { type: 'boolean', short: 'y' },
  // migrate only
  write: { type: 'boolean' },
} as const;

// The commands each flag applies to, when it is not a build option every command takes.
const SCOPED_FLAGS = {
  'component-file': [Command.INIT, Command.MIGRATE],
  framework: [Command.INIT],
  component: [Command.INIT],
  scripts: [Command.INIT],
  'agents-md': [Command.INIT],
  'cdn-url': [Command.INIT],
  yes: [Command.INIT],
  write: [Command.MIGRATE],
} as const satisfies Partial<Record<keyof typeof OPTIONS, readonly Command[]>>;

const describeScope = (commands: readonly Command[]): string =>
  commands.map((command) => `"svgworm ${command}"`).join(' and ');

const CROSS_ORIGINS: readonly string[] = Object.values(CrossOrigin);

const isCrossOrigin = (value: string): value is CrossOrigin =>
  CROSS_ORIGINS.includes(value);

const FRAMEWORKS: readonly string[] = Object.values(Framework);

const isFramework = (value: string): value is Framework =>
  FRAMEWORKS.includes(value);

const isCommand = (value: string): value is Command => COMMANDS.includes(value);

const KNOWN_FLAGS: readonly string[] = Object.entries(OPTIONS).flatMap(
  ([name, option]) => [
    `--${name}`,
    ...('short' in option ? [`-${option.short}`] : []),
  ],
);

/** parseArgs explains positionals at length; a typo wants the nearest flag instead. */
const describeParseError = (error: unknown): string => {
  if (!(error instanceof Error)) return String(error);
  if ('code' in error && error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
    const flag = /'(-[^']+)'/.exec(error.message)?.[1];
    if (flag !== undefined) {
      return `unknown flag "${flag}".${didYouMean(suggestClosest(flag, KNOWN_FLAGS))}`.replace(
        /\.$/,
        '',
      );
    }
  }
  return error.message;
};

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
    if (command === Command.MIGRATE) {
      const [target, ...rest] = extra;
      if (target === undefined || !isMigrateTarget(target) || rest.length > 0) {
        return usageError(
          `migrate needs a source to migrate from: svgworm migrate ${MIGRATE_TARGETS.join('|')}`,
        );
      }
    } else if (!isCommand(command) || extra.length > 0) {
      return usageError(
        `unknown command "${positionals.join(' ')}". Commands: ${COMMANDS.join(', ')}`,
      );
    }
    const sources = values.source;
    const outDir = values['out-dir'];
    const publicPath = values['public-path'];
    const moduleDir = values['module-dir'];
    const flatten = values.flatten;
    const crossOrigin = values['cross-origin'];
    if (crossOrigin !== undefined && !isCrossOrigin(crossOrigin)) {
      return usageError(
        `--cross-origin must be one of: ${CROSS_ORIGINS.join(', ')} (got "${crossOrigin}")`,
      );
    }

    const misplaced = Object.entries(SCOPED_FLAGS).find(
      ([flag, commands]) =>
        values[flag as keyof typeof SCOPED_FLAGS] !== undefined &&
        !(commands as readonly Command[]).includes(command),
    );
    if (misplaced !== undefined) {
      const [flag, commands] = misplaced;
      return usageError(`--${flag} only applies to ${describeScope(commands)}`);
    }
    // Only given flags become overrides, so a flag never blanks a config value.
    const overrides: ConfigOverrides = {
      ...(sources === undefined ? {} : { sources }),
      ...(outDir === undefined ? {} : { outDir }),
      ...(publicPath === undefined ? {} : { publicPath }),
      ...(moduleDir === undefined ? {} : { moduleDir }),
      ...(flatten === undefined ? {} : { flatten }),
      ...(crossOrigin === undefined ? {} : { crossOrigin }),
    };

    if (command === Command.INIT) {
      if (crossOrigin !== undefined) {
        return usageError(
          'init takes --cdn-url <https-url> instead of --cross-origin',
        );
      }
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
          cdnUrl: values['cdn-url'],
        },
      };
    }

    if (command === Command.MIGRATE) {
      return {
        kind: 'migrate',
        target: MigrateTarget.SVGR,
        configFile: values.config,
        overrides,
        isJson: values.json === true,
        isWrite: values.write === true,
        componentFile: values['component-file'],
      };
    }
    return {
      kind: 'command',
      command,
      configFile: values.config,
      isJson: values.json === true,
      isVerbose: values.verbose === true,
      overrides,
    };
  } catch (error) {
    return usageError(describeParseError(error));
  }
};
