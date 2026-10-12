import type { CliIo } from '../io.ts';

import { ExitCode } from '../exit-codes.ts';
import { applyInit } from '../init/apply.ts';
import {
  inspectProject,
  planInit,
  validateInitOptions,
  type InitOptions,
} from '../init/plan.ts';
import { askInitOptions, InitCancelledError } from '../init/prompts.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';

/**
 * Sets a project up: config file, predev/prebuild scripts, the Icon wiring and, on request,
 * an AGENTS.md section. Prompts only on an interactive terminal; flags drive it otherwise
 * (R-56). Re-running is idempotent.
 */
export const runInitCommand = async (
  options: InitOptions,
  io: CliIo,
  reporter: Reporter,
  isInteractive: boolean,
): Promise<ExitCode> => {
  try {
    // Flags first, so a bad flag fails before any prompt; answers again, since they can change paths.
    const flagIssues = validateInitOptions(options, io.cwd);
    if (flagIssues.length > 0) {
      reporter.fatal(flagIssues.join('\n'), FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    const facts = await inspectProject(io.cwd, options);
    const answered = isInteractive
      ? await askInitOptions(options, facts)
      : options;
    const issues = validateInitOptions(answered, io.cwd);
    if (issues.length > 0) {
      reporter.fatal(issues.join('\n'), FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    // Answers can change the component path, so look again before planning.
    const plan = planInit(
      answered,
      isInteractive ? await inspectProject(io.cwd, answered) : facts,
    );
    reporter.initialized(await applyInit(io.cwd, plan));
    return ExitCode.OK;
  } catch (error) {
    if (error instanceof InitCancelledError) {
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
