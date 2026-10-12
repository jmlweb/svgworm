import type { BuildSuccess, Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { FatalCode, Reporter } from './types.ts';

import { createPlainReporter } from './plain.ts';

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
  const print = (document: unknown): void => {
    io.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
    warnings = [];
  };

  return {
    onEvent: (event) => {
      if (event.type === 'warning') warnings.push(event.diagnostic);
      diagnostics.onEvent(event);
    },
    succeed: (result: BuildSuccess) => {
      print({
        ok: true,
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
        upToDate: result.upToDate,
        stale: result.stale,
        iconDiff: result.iconDiff,
        stats: result.stats,
        icons: result.icons,
        warnings: result.warnings,
        errors: [],
      });
    },
    fail: (errors) => {
      diagnostics.fail(errors);
      print({ ok: false, stats: null, icons: [], warnings, errors });
    },
    fatal: (message: string, code: FatalCode) => {
      diagnostics.fatal(message, code);
      print({
        ok: false,
        stats: null,
        icons: [],
        warnings,
        errors: [{ code, file: '', message }],
      });
    },
    // Idle state is not a result, and stdout holds results only.
    watching: () => undefined,
    initialized: (result) => {
      print({
        ok: true,
        actions: result.actions,
        nextSteps: result.nextSteps,
        warnings: [],
        errors: [],
      });
    },
  };
};
