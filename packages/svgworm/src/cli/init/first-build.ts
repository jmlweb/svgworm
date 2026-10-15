import {
  build,
  ConfigError,
  DiagnosticCode,
  loadConfig,
  type Diagnostic,
} from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { FatalCode } from '../reporters/types.ts';

export type FirstBuildError = {
  readonly code: DiagnosticCode | FatalCode;
  readonly file: string;
  readonly message: string;
};

/** The build `init` runs last, so the generated module exists before the app first imports it. */
export type FirstBuild =
  | {
      readonly ok: true;
      readonly icons: number;
      readonly written: readonly string[];
      readonly warnings: readonly Diagnostic[];
    }
  | {
      readonly ok: false;
      readonly errors: readonly FirstBuildError[];
      readonly warnings: readonly Diagnostic[];
    };

/**
 * Builds from the config on disk, not from the init options: a config init skipped because
 * it differs is still the one `predev` and `prebuild` will use.
 */
export const runFirstBuild = async (
  cwd: string,
  configFile: string,
): Promise<FirstBuild> => {
  try {
    const result = await build(await loadConfig({ cwd, configFile }));
    return result.ok
      ? {
          ok: true,
          icons: result.stats.icons,
          written: result.written,
          warnings: result.warnings,
        }
      : { ok: false, errors: result.errors, warnings: result.warnings };
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    return {
      ok: false,
      errors: [{ code: FatalCode.USAGE, file: '', message: error.message }],
      warnings: [],
    };
  }
};

/** Same mapping as `build`: only setup problems (no icons, bad config) are exit 2. */
export const exitCodeForFirstBuild = (result: FirstBuild): ExitCode =>
  result.ok
    ? ExitCode.OK
    : result.errors.every(
          (error) =>
            error.code === DiagnosticCode.NO_ICONS ||
            error.code === FatalCode.USAGE,
        )
      ? ExitCode.USAGE
      : ExitCode.FAILED;
