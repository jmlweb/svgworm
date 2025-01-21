import { isMainThread, parentPort } from 'node:worker_threads';

import colors from 'picocolors';

import { PrettyError } from './pretty-error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleError = (error: any) => {
  if (error.loc) {
    console.error(
      colors.bold(
        colors.red(
          `Error parsing: ${error.loc.file}:${error.loc.line}:${error.loc.column}`,
        ),
      ),
    );
  }
  if (error.frame) {
    console.error(colors.red(error.message));
    console.error(colors.dim(error.frame));
  } else if (error instanceof PrettyError) {
    console.error(colors.red(error.message));
  } else {
    console.error(colors.red(error.stack));
  }
  process.exitCode = 1;
  if (!isMainThread && parentPort) {
    parentPort.postMessage('error');
  }
};
