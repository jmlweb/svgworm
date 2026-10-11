/** Stable and public: scripts and agents branch on these (ADR-0008, "CLI behavior contract"). */
export const ExitCode = {
  OK: 0,
  /** Invalid SVGs, name collisions, or an I/O failure. */
  FAILED: 1,
  /** Usage or configuration error, including a folder with no icons. */
  USAGE: 2,
} as const;
export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];
