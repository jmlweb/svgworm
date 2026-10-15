import { watch } from '../../core/api.ts';
import { ExitCode } from '../exit-codes.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';
import { withConfig, type CommandInput } from './build.ts';

const STOP_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

/**
 * Without a host signal, Ctrl+C or a TERM signal ends the watch. The handlers live only for
 * the watch, so other commands keep the default behavior of stopping at once.
 */
const processSignal = (): { signal: AbortSignal; release: () => void } => {
  const controller = new AbortController();
  const stop = (): void => {
    controller.abort();
  };
  STOP_SIGNALS.forEach((name) => process.once(name, stop));
  return {
    signal: controller.signal,
    release: () => {
      STOP_SIGNALS.forEach((name) => process.off(name, stop));
    },
  };
};

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
    const host =
      signal === undefined
        ? processSignal()
        : { signal, release: (): void => undefined };
    try {
      await watch(config, {
        onEvent: reporter.onEvent,
        onResult: (result) => {
          if (result.ok) reporter.succeed(result);
          else reporter.fail(result.errors);
          reporter.watching(config.sources.map((source) => source.dir));
        },
        onError: (error) => {
          reporter.fatal(
            `unexpected failure: ${error instanceof Error ? error.message : String(error)}`,
            FatalCode.UNEXPECTED,
          );
          reporter.watching(config.sources.map((source) => source.dir));
        },
        signal: host.signal,
      });
    } finally {
      host.release();
    }
    return ExitCode.OK;
  });
