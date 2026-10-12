import type { CliIo } from './io.ts';

import { Command, parseCliArgs } from './args.ts';
import { runBuildCommand } from './commands/build.ts';
import { runCheckCommand } from './commands/check.ts';
import { runWatchCommand } from './commands/watch.ts';
import { ExitCode } from './exit-codes.ts';
import { USAGE } from './help.ts';
import { selectReporter } from './reporters/select.ts';
import { FatalCode } from './reporters/types.ts';
import { readVersion } from './version.ts';

/** The whole CLI as a function of its arguments and host, so tests need no process. */
export const run = async (
  argv: readonly string[],
  io: CliIo,
): Promise<ExitCode> => {
  const args = parseCliArgs(argv);
  switch (args.kind) {
    case 'help':
      io.stdout.write(USAGE);
      return ExitCode.OK;
    case 'version':
      io.stdout.write(`${readVersion()}\n`);
      return ExitCode.OK;
    case 'usage-error':
      selectReporter(io, args.isJson).fatal(
        `${args.message}\nRun "svgworm --help" for usage.`,
        FatalCode.USAGE,
      );
      return ExitCode.USAGE;
    case 'command': {
      const input = {
        cwd: io.cwd,
        configFile: args.configFile,
        overrides: args.overrides,
      };
      const reporter = selectReporter(io, args.isJson);
      switch (args.command) {
        case Command.BUILD:
          return runBuildCommand(input, reporter);
        case Command.CHECK:
          return runCheckCommand(input, reporter);
        case Command.WATCH:
          return runWatchCommand(input, reporter, io.signal);
      }
    }
  }
};
