---
id: TSK-102
title: Fix: watch.test.ts 'keeps watching after a failed build' flakes on Windows CI (vi.waitFor 1 s default)
status: pending
priority: P4
tags: [testing, watch, ci]
created: 2026-10-31
source: report/RPT-009
depends-on: []
---

# Fix: watch.test.ts 'keeps watching after a failed build' flakes on Windows CI (vi.waitFor 1 s default)

## Description

`packages/svgworm/src/core/watch.test.ts` › "keeps watching after a failed build and reports the failure" failed once on Windows CI (run 38830758042) because its `vi.waitFor` calls use the 1000 ms default. `.claude/rules/testing.md` already requires an explicit timeout, but on 2026-10-31 only the call at `watch.test.ts:254` passes `{ timeout: 5000 }`; the calls at lines 71, 78, 102, 111, 129, 134, 140, 164, 211, 216, 246, 280 and 290 still use the default. Add the explicit timeout to each. A passing run takes no longer.

## Acceptance Criteria

- [ ] Every vi.waitFor call in packages/svgworm/src/core/watch.test.ts passes an explicit timeout such as { timeout: 5000 }
- [ ] pnpm test passes on Linux, macOS and Windows CI

## Notes

## Learnings

## Progress Log

- [2026-10-31] Created