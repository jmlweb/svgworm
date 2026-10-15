---
id: TSK-043
title: Fix: Core repeats small I/O and path helpers that must stay identical
status: complete
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-003
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Fix: Core repeats small I/O and path helpers that must stay identical

## Description

### Summary
Low-level helpers that carry determinism or error policy are written out in several places. Today the copies agree, but nothing keeps them in step.

### Key details
- ENOENT check, 5 copies: `core/write.ts:40`, `core/check.ts:50`, `core/config/resolve.ts:122`, `cli/init/apply.ts:12`, `cli/init/plan.ts:121`, plus near-identical "read or undefined" wrappers.
- Atomic write (temp + rename + cleanup): `core/write.ts:57` and `cli/init/apply.ts:25`.
- Diagnostic comparator: `core/compile.ts:76` and `core/build.ts:74`. Diagnostics order is deterministic output.
- `\` to `/` inline in `naming.ts:37`, `discover.ts:87`, `watch.ts:55`, `write.ts:38`, `plan.ts:114`, although `toDisplayPath` exists (`collisions.ts:7`).
- Behavior impact: `readdir(...).catch(() => [])` in `check.ts:128` and `plan.ts:238` swallows every error, so a permission error on `outDir` makes `check` skip stale detection silently.
- Keep `src/core` free of `src/cli` imports: shared helpers live in core and the CLI imports them.

Source: RPT-003.

## Acceptance Criteria

- [x] One shared isMissing / readIfPresent / replaceFile used by core/write.ts, core/check.ts, core/config/resolve.ts, cli/init/apply.ts and cli/init/plan.ts — evidence: core/fs.ts exports isMissing, hasErrorCode, readIfPresent, readTextIfPresent, listDirectory, replaceFile; used by core/write.ts, core/check.ts, core/config/resolve.ts, cli/init/apply.ts, cli/init/plan.ts (grep: no local copies left) (2026-10-15)
- [x] One exported diagnostic comparator used by compile.ts and build.ts — evidence: collisions.ts exports compareDiagnostics; compile.ts and build.ts sort with it (2026-10-15)
- [x] Backslash-to-slash conversion goes through one helper (toDisplayPath or a shared toPosix) — evidence: core/fs.ts toPosix; toDisplayPath delegates to it; naming.ts, discover.ts, watch.ts, write.ts, plan.ts use it (grep replaceAll backslash: only fs.ts and a test helper) (2026-10-15)
- [x] readdir fallbacks in check.ts and plan.ts swallow only ENOENT; a test shows a permission error is no longer hidden — evidence: listDirectory swallows ENOENT only; check.test.ts reports an unreadable output folder instead of calling the check clean (chmod 000 → rejects EACCES) → pass (2026-10-15)
- [x] Output snapshots and the determinism fingerprint are unchanged — evidence: pnpm vitest run → 30 files, 480 passed, no snapshot updates; pnpm determinism:fingerprint before and after the refactor: identical (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Shared helpers in core/fs.ts; cli imports them from core (lint boundary kept). detectYarnBerry keeps its readdir catch on purpose: it walks parent folders as a heuristic. No changeset: internal refactor, output unchanged.
- [2026-10-15] Completed