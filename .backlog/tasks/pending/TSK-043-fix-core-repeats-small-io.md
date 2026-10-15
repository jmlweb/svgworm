---
id: TSK-043
title: Fix: Core repeats small I/O and path helpers that must stay identical
status: pending
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-003
depends-on: []
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

- [ ] One shared isMissing / readIfPresent / replaceFile used by core/write.ts, core/check.ts, core/config/resolve.ts, cli/init/apply.ts and cli/init/plan.ts
- [ ] One exported diagnostic comparator used by compile.ts and build.ts
- [ ] Backslash-to-slash conversion goes through one helper (toDisplayPath or a shared toPosix)
- [ ] readdir fallbacks in check.ts and plan.ts swallow only ENOENT; a test shows a permission error is no longer hidden
- [ ] Output snapshots and the determinism fingerprint are unchanged

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created