import {
  build,
  ConfigError,
  DiagnosticCode,
  loadConfig,
  type ConfigOverrides,
} from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';

export type BuildCommand = {
  readonly cwd: string;
  readonly configFile: string | undefined;
  readonly overrides: ConfigOverrides;
};

/** Runs the build and maps every outcome to an exit code. The reporter does all printing. */
export const runBuildCommand = async (
  command: BuildCommand,
  reporter: Reporter,
): Promise<ExitCode> => {
  try {
    const config = await loadConfig({
      cwd: command.cwd,
      overrides: command.overrides,
      ...(command.configFile === undefined
        ? {}
        : { configFile: command.configFile }),
    });
    const result = await build(config, reporter.onEvent);
    if (result.ok) {
      reporter.succeed(result);
      return ExitCode.OK;
    }
    reporter.fail(result.errors);
    // A folder with no icons is a setup mistake, not a bad icon.
    return result.errors.every(
      (error) => error.code === DiagnosticCode.NO_ICONS,
    )
      ? ExitCode.USAGE
      : ExitCode.FAILED;
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
