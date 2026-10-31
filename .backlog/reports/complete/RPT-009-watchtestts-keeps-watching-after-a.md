---
id: RPT-009
title: watch.test.ts 'keeps watching after a failed build' flakes on Windows CI (vi.waitFor 1 s default)
type: bug
severity: low
status: triaged
created: 2026-10-16
triaged: 2026-10-31
task-id: TSK-102
---

## Summary

`packages/svgworm/src/core/watch.test.ts` › "keeps watching after a failed build and reports the failure" failed once on `Test (windows-latest, Node 24)`: `expected [ { ok: true, …(7) } ] to have a length of 2 but got 1`. The test took 1089 ms. The `vi.waitFor` calls use the default 1000 ms timeout, so a slow Windows runner can miss the second build.

## Where found

CI run 38830758042 (push ff3e633, 2026-10-16). A rerun of only the failed job passed. Windows on Node 22 and 26 passed in the same run.

## Impact

A red CI on `main` with no code cause, which needs a manual rerun. Fix: give the watch tests' `vi.waitFor` calls an explicit timeout (for example `{ timeout: 5000 }`). That only lengthens a failing run, not a passing one.
