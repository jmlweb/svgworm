export type Writable = { readonly write: (text: string) => unknown };

/** Everything the CLI needs from its host, so tests can run it without a process. */
export type CliIo = {
  readonly stdout: Writable;
  readonly stderr: Writable;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly isTTY: boolean;
  readonly cwd: string;
};
