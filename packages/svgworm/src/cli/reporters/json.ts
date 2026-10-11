import type { BuildSuccess, Diagnostic } from '../../core/api.ts';
import type { CliIo } from '../io.ts';
import type { FatalCode, Reporter } from './types.ts';

import { createPlainReporter } from './plain.ts';

/**
 * One document on stdout and nothing else (R-56). The human diagnostics still go to
 * stderr, as in every mode, so a failing run is readable in a log as well.
 */
export const createJsonReporter = (io: CliIo): Reporter => {
  const diagnostics = createPlainReporter({
    ...io,
    stdout: { write: () => undefined },
  });
  const warnings: Diagnostic[] = [];
  const print = (document: unknown): void => {
    io.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
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
  };
};
