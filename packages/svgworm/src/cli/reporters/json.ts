import type { BuildSuccess, Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { Reporter } from './types.ts';

import { createPlainReporter } from './plain.ts';
import { FatalCode } from './types.ts';

/**
 * One document on stdout and nothing else (R-56). The human diagnostics still go to
 * stderr, as in every mode, so a failing run is readable in a log as well. `watch`
 * prints one document per build.
 */
export const createJsonReporter = (io: CliIo): Reporter => {
  const diagnostics = createPlainReporter({
    ...io,
    stdout: { write: () => undefined },
  });
  let warnings: Diagnostic[] = [];
  let sourcesDefaulted = false;
  const print = (document: unknown): void => {
    io.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
    warnings = [];
  };

  return {
    usingDefaultSource: () => {
      sourcesDefaulted = true;
    },
    onEvent: (event) => {
      if (event.type === 'warning') warnings.push(event.diagnostic);
      diagnostics.onEvent(event);
    },
    succeed: (result: BuildSuccess) => {
      print({
        ok: true,
        sourcesDefaulted,
        stats: result.stats,
        icons: result.icons,
        warnings: result.warnings,
        errors: [],
      });
    },
    checked: (result) => {
      diagnostics.checked(result);
      print({
        ok: result.upToDate,
        sourcesDefaulted,
        upToDate: result.upToDate,
        differences: result.differences,
        // Deprecated alias of `differences`, kept for one minor.
        stale: result.differences,
        iconDiff: result.iconDiff,
        stats: result.stats,
        icons: result.icons,
        warnings: result.warnings,
        errors: [],
      });
    },
    fail: (errors) => {
      diagnostics.fail(errors);
      print({
        ok: false,
        sourcesDefaulted,
        stats: null,
        icons: [],
        warnings,
        errors,
      });
    },
    fatal: (message: string, code: FatalCode) => {
      diagnostics.fatal(message, code);
      print({
        ok: false,
        sourcesDefaulted,
        stats: null,
        icons: [],
        warnings,
        errors: [{ code, file: '', message }],
      });
    },
    // Idle state is not a result, and stdout holds results only.
    watching: () => undefined,
    initialized: (result) => {
      diagnostics.initialized(result);
      const { build } = result;
      print({
        ok: build.ok,
        framework: result.framework ?? null,
        frameworkSource: result.frameworkSource ?? null,
        actions: result.actions,
        build: build.ok
          ? { ok: true, icons: build.icons, written: build.written }
          : { ok: false },
        nextSteps: result.nextSteps,
        warnings: build.warnings,
        errors: build.ok ? [] : build.errors,
      });
    },
    migrated: (result) => {
      diagnostics.migrated(result);
      print({
        ok: result.skipped.length === 0 && result.writeErrors.length === 0,
        sourcesDefaulted,
        write: result.isWrite,
        componentFile: result.componentFile,
        files: result.files,
        skipped: result.skipped,
        warnings: [],
        errors: result.writeErrors.map((failure) => ({
          code: FatalCode.UNEXPECTED,
          file: failure.file,
          message: `could not write the rewrite, the file is unchanged: ${failure.message}`,
        })),
      });
    },
  };
};
