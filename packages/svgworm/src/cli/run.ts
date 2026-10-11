import type { CliIo } from './io.ts';

import { parseCliArgs } from './args.ts';
import { runBuildCommand } from './commands/build.ts';
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
    case 'build':
      return runBuildCommand(
        {
          cwd: io.cwd,
          configFile: args.configFile,
          overrides: args.overrides,
        },
        selectReporter(io, args.isJson),
      );
  }
};
