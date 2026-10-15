import type { CliIo } from '../io.ts';

import { ExitCode } from '../exit-codes.ts';
import { applyInit } from '../init/apply.ts';
import { exitCodeForFirstBuild, runFirstBuild } from '../init/first-build.ts';
import {
  frameworkProblem,
  inspectProject,
  planInit,
  validateInitOptions,
  type InitOptions,
} from '../init/plan.ts';
import { askInitOptions, InitCancelledError } from '../init/prompts.ts';
import { FatalCode, type Reporter } from '../reporters/types.ts';

/**
 * Sets a project up: config file, package.json scripts, the Icon wiring, a sample icon when
 * the sources are empty and, on request, an AGENTS.md section. Then it builds once, so the app
 * runs and type-checks before the user adds an icon. Prompts only on an interactive terminal;
 * flags drive it otherwise (R-56). Re-running is idempotent.
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
    if (!facts.hasPackageJson && facts.packageJsonAbove !== undefined) {
      reporter.fatal(
        `no package.json in ${io.cwd}; found one in ${facts.packageJsonAbove}\n  run svgworm init from there, so the config and scripts land in the package`,
        FatalCode.USAGE,
      );
      return ExitCode.USAGE;
    }
    const flagFramework = frameworkProblem(options, facts);
    if (flagFramework !== undefined) {
      reporter.fatal(flagFramework, FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    const answered = isInteractive
      ? await askInitOptions(options, facts)
      : options;
    const mismatch = frameworkProblem(answered, facts);
    const issues = [
      ...validateInitOptions(answered, io.cwd),
      ...(mismatch === undefined ? [] : [mismatch]),
    ];
    if (issues.length > 0) {
      reporter.fatal(issues.join('\n'), FatalCode.USAGE);
      return ExitCode.USAGE;
    }
    // Answers can change the component path, so look again before planning.
    const plan = planInit(
      answered,
      isInteractive ? await inspectProject(io.cwd, answered) : facts,
    );
    const applied = await applyInit(io.cwd, plan);
    const build = await runFirstBuild(io.cwd, answered.configFile);
    reporter.initialized({ ...applied, build });
    return exitCodeForFirstBuild(build);
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
