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

/** `--json`, else clack on an interactive terminal outside CI, else plain (ADR-0008). */
export const selectReporter = (io: CliIo, isJson: boolean): Reporter => {
  if (isJson) return createJsonReporter(io);
  if (io.isTTY && !isCi(io.env)) return createClackReporter(io);
  return createPlainReporter(io);
};
