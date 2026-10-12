export type Writable = { readonly write: (text: string) => unknown };

/** Everything the CLI needs from its host, so tests can run it without a process. */
export type CliIo = {
  readonly stdout: Writable;
  readonly stderr: Writable;
  readonly env: Readonly<Record<string, string | undefined>>;
  /** stdout is a terminal: picks the animated reporter. */
  readonly isTTY: boolean;
  /** stdin is a terminal too: prompts are allowed (ADR-0008). Default false. */
  readonly isInputTTY?: boolean;
  readonly cwd: string;
  /** Ends `watch`, for tests. Without it, `watch` listens to SIGINT and SIGTERM itself. */
  readonly signal?: AbortSignal;
};
