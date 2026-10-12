import { check } from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { type Reporter } from '../reporters/types.ts';
import { exitCodeForErrors, withConfig, type CommandInput } from './build.ts';

/** Exit 1 when the committed output is stale (R-31), without writing anything. */
export const runCheckCommand = (
  input: CommandInput,
  reporter: Reporter,
): Promise<ExitCode> =>
  withConfig(input, reporter, async (config) => {
    const result = await check(config, reporter.onEvent);
    if (!result.ok) {
      reporter.fail(result.errors);
      return exitCodeForErrors(result.errors);
    }
    reporter.checked(result);
    return result.upToDate ? ExitCode.OK : ExitCode.FAILED;
  });
