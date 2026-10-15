import {
  build,
  ConfigError,
  DEFAULT_SOURCE,
  DiagnosticCode,
  loadConfig,
  type ConfigOverrides,
  type Diagnostic,
  type ResolvedConfig,
} from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';

export type CommandInput = {
  readonly cwd: string;
  readonly configFile: string | undefined;
  readonly overrides: ConfigOverrides;
};

/** A folder with no icons is a setup mistake (exit 2), not a bad icon (exit 1). */
export const exitCodeForErrors = (errors: readonly Diagnostic[]): ExitCode =>
  errors.every((error) => error.code === DiagnosticCode.NO_ICONS)
    ? ExitCode.USAGE
    : ExitCode.FAILED;

/**
 * Loads the config and runs `action`, mapping a config error to exit 2 and anything
 * unexpected to exit 1. The reporter does all printing.
 */
export const withConfig = async (
  input: CommandInput,
  reporter: Reporter,
  action: (config: ResolvedConfig) => Promise<ExitCode>,
): Promise<ExitCode> => {
  try {
    const config = await loadConfig({
      cwd: input.cwd,
      overrides: input.overrides,
      ...(input.configFile === undefined
        ? {}
        : { configFile: input.configFile }),
    });
    if (config.isDefaultSources) {
      reporter.usingDefaultSource(DEFAULT_SOURCE);
    }
    return await action(config);
  } catch (error) {
    if (error instanceof ConfigError) {
      reporter.fatal(error.message, FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    reporter.fatal(
      `unexpected failure: ${error instanceof Error ? error.message : String(error)}`,
      FatalCode.UNEXPECTED,
    );
    return ExitCode.FAILED;
  }
};

/** Runs the build and maps every outcome to an exit code. */
export const runBuildCommand = (
  input: CommandInput,
  reporter: Reporter,
): Promise<ExitCode> =>
  withConfig(input, reporter, async (config) => {
    const result = await build(config, reporter.onEvent);
    if (result.ok) {
      reporter.succeed(result);
      return ExitCode.OK;
    }
    reporter.fail(result.errors);
    return exitCodeForErrors(result.errors);
  });
