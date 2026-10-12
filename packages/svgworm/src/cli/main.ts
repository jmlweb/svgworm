import { run } from './run.ts';

// No signal here: `watch` hooks SIGINT/SIGTERM itself, so Ctrl+C still ends the other
// commands at once instead of being swallowed by an unused AbortController.
process.exitCode = await run(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env,
  isTTY: process.stdout.isTTY,
  isInputTTY: process.stdin.isTTY,
  cwd: process.cwd(),
});
