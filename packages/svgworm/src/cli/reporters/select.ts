import type { CliIo } from '../io.ts';
import type { Reporter } from './types.ts';

import { createClackReporter } from './clack.ts';
import { createJsonReporter } from './json.ts';
import { createPlainReporter } from './plain.ts';

export const isCi = (env: CliIo['env']): boolean => {
  const value = env['CI'];
  return (
    value !== undefined && value !== '' && value !== '0' && value !== 'false'
  );
};

export type ReporterOptions = {
  readonly isJson: boolean;
  /** Plain output lists every icon. The clack and JSON reporters ignore it. */
  readonly isVerbose?: boolean;
};

/** `--json`, else clack on an interactive terminal outside CI, else plain (ADR-0008). */
export const selectReporter = (
  io: CliIo,
  options: ReporterOptions,
): Reporter => {
  if (options.isJson) return createJsonReporter(io);
  if (io.isTTY && !isCi(io.env)) return createClackReporter(io);
  return createPlainReporter(io, { isVerbose: options.isVerbose === true });
};
