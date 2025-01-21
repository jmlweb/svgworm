import { extractErrorMessage } from './extract-error-message';

export class PrettyError extends Error {
  static of(error: unknown, title?: string) {
    const message = title
      ? `${title}: ${extractErrorMessage(error)}`
      : extractErrorMessage(error);
    return new PrettyError(message);
  }

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
