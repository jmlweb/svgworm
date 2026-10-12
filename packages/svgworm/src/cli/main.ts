#!/usr/bin/env node
import { run } from './run.ts';

// Ctrl+C ends `watch` cleanly; the other commands finish their current step first.
const controller = new AbortController();
const stop = (): void => {
  controller.abort();
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

process.exitCode = await run(process.argv.slice(2), {
  stdout: process.stdout,
  stderr: process.stderr,
  env: process.env,
  isTTY: process.stdout.isTTY,
  isInputTTY: process.stdin.isTTY,
  cwd: process.cwd(),
  signal: controller.signal,
});
