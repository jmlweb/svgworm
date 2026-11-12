---
id: TSK-102
title: Fix: watch.test.ts 'keeps watching after a failed build' flakes on Windows CI (vi.waitFor 1 s default)
status: complete
priority: P4
tags: [testing, watch, ci]
created: 2026-10-31
source: report/RPT-009
depends-on: []
started: 2026-11-12
completed: 2026-11-12
---

# Fix: watch.test.ts 'keeps watching after a failed build' flakes on Windows CI (vi.waitFor 1 s default)

## Description

`packages/svgworm/src/core/watch.test.ts` › "keeps watching after a failed build and reports the failure" failed once on Windows CI (run 38830758042) because its `vi.waitFor` calls use the 1000 ms default. `.claude/rules/testing.md` already requires an explicit timeout, but on 2026-10-31 only the call at `watch.test.ts:254` passes `{ timeout: 5000 }`; the calls at lines 71, 78, 102, 111, 129, 134, 140, 164, 211, 216, 246, 280 and 290 still use the default. Add the explicit timeout to each. A passing run takes no longer.

## Acceptance Criteria

- [x] Every vi.waitFor call in packages/svgworm/src/core/watch.test.ts passes an explicit timeout such as { timeout: 5000 }
- [x] pnpm test passes on Linux, macOS and Windows CI

## Notes

## Learnings

- LRN-066: Check git log for a fix landed outside the task before implementing it
## Progress Log

- [2026-10-31] Created
- [2026-11-12] Started
- [2026-11-12] criterion 1 — evidence: already done in 73024f2 (#28); rg -c 'vi.waitFor\(' watch.test.ts → 14 calls, 13 pass the shared 'settled' = { timeout: 5000 } and 1 passes { timeout: 5000 } inline (2026-11-12)
- [2026-11-12] criterion 2 — evidence: CI run 42702794833 on main at 73024f2 → all 9 Test jobs (ubuntu, macos, windows × Node 22, 24, 26) success; local 'pnpm --filter svgworm exec vitest run src/core/watch.test.ts' → 9 passed (2026-11-12)
- [2026-11-12] Completed