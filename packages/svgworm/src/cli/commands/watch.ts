import { watch } from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';
import { withConfig, type CommandInput } from './build.ts';

/**
 * Builds, then rebuilds on every change until `signal` aborts (R-30). A failed build is
 * reported and watching goes on, so the exit code is 0 when the watch ends.
 */
export const runWatchCommand = (
  input: CommandInput,
  reporter: Reporter,
  signal: AbortSignal | undefined,
): Promise<ExitCode> =>
  withConfig(input, reporter, async (config) => {
    await watch(config, {
      onEvent: reporter.onEvent,
      onResult: (result) => {
        if (result.ok) reporter.succeed(result);
        else reporter.fail(result.errors);
        reporter.watching(config.sources);
      },
      onError: (error) => {
        reporter.fatal(
          `unexpected failure: ${error instanceof Error ? error.message : String(error)}`,
          FatalCode.UNEXPECTED,
        );
        reporter.watching(config.sources);
      },
      ...(signal === undefined ? {} : { signal }),
    });
    return ExitCode.OK;
  });
