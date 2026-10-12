---
id: TSK-013
title: Watch mode and CI check mode
status: complete
priority: P3
tags: [cli, dx]
created: 2026-10-07
source: manual
depends-on: [TSK-011]
started: 2026-10-12
completed: 2026-10-12
---

# Watch mode and CI check mode

## Description

R-31 in v0.1: check mode exits non-zero if committed output is stale. R-30 in v0.1: watch rebuilds everything on change, which is fast enough under the R-50 budget and what `next dev` needs. Incremental watch is a new post-v0.1 task. Cleanup (R-15) lives in TSK-011.

## Acceptance Criteria

- [x] Watch rebuilds everything on change (v0.1); incremental watch is post-v0.1
- [x] check exits 1 on stale output with diff summary

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Added core check (compileFromDisk + byte compare with disk, stale sprite scan, icon name diff) and watch (debounced recursive fs.watch, full rebuild, AbortSignal to stop). Commit 2726847.
- [2026-10-12] CLI: `svgworm check` exits 1 when stale with a per-file list and icon diff summary, 0 when up to date; `svgworm watch` builds then rebuilds on change, exit 0 on Ctrl+C. Both take the build flags and --json (watch prints one document per build).
- [2026-10-12] Tests: core check/watch unit tests (fake watcher plus one real fs.watch smoke test), CLI exit-code tests, plain and JSON check snapshots. README, llms.txt, help and a changeset updated.
- [2026-10-12] Criterion 1 met (full rebuild on change; incremental is TSK-023). Criterion 2 met (check exits 1 with diff summary).
- [2026-10-12] Completed