import type {
  BuildEventHandler,
  BuildSuccess,
  Diagnostic,
} from '../../core/api.ts';

/** Machine-readable cause of a failure that has no file to point at. */
export const FatalCode = {
  USAGE: 'cli/usage',
  UNEXPECTED: 'cli/unexpected',
} as const;
export type FatalCode = (typeof FatalCode)[keyof typeof FatalCode];

/**
 * The CLI's only output channel. The core never prints: it emits events, and a reporter
 * decides how to show them (ADR-0008, "CLI behavior contract").
 */
export type Reporter = {
  readonly onEvent: BuildEventHandler;
  readonly succeed: (result: BuildSuccess) => void;
  /** Invalid input. Nothing was written. */
  readonly fail: (errors: readonly Diagnostic[]) => void;
  /** Usage, config or I/O problem that has no file to point at. */
  readonly fatal: (message: string, code: FatalCode) => void;
};
