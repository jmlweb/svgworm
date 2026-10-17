import { ExitCode } from '../exit-codes.ts';
import {
  MissingComponentError,
  runSvgrMigration,
  type MigrationOptions,
} from '../migrate/run.ts';
import {
  loadTypeScript,
  MISSING_TYPESCRIPT_HINT,
  type TypeScriptApi,
} from '../migrate/typescript.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';
import { withConfig, type CommandInput } from './build.ts';

/**
 * `migrate svgr`: rewrites SVGR imports into Icon calls, as a dry run unless `isWrite`. Exits 1
 * when any import stays on SVGR, so a script or an agent sees an unfinished migration.
 */
export const runMigrateCommand = (
  input: CommandInput,
  options: MigrationOptions,
  reporter: Reporter,
  load: (cwd: string) => Promise<TypeScriptApi | undefined> = loadTypeScript,
): Promise<ExitCode> =>
  withConfig(input, reporter, async (config) => {
    const ts = await load(config.cwd);
    if (ts === undefined) {
      reporter.fatal(MISSING_TYPESCRIPT_HINT, FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    try {
      const report = await runSvgrMigration(config, options, ts);
      reporter.migrated(report);
      return report.skipped.length === 0 ? ExitCode.OK : ExitCode.FAILED;
    } catch (error) {
      if (error instanceof MissingComponentError) {
        reporter.fatal(error.message, FatalCode.USAGE);
        return ExitCode.USAGE;
      }
      throw error;
    }
  });
