import { isMainThread, parentPort } from 'node:worker_threads';

import colors from 'picocolors';

export class PrettyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleError(error: any) {
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
}
