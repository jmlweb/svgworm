---
id: RPT-003
title: Core repeats small I/O and path helpers that must stay identical
type: improvement
severity: low
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-043
---

## Summary
A few low-level helpers that carry determinism or error policy are written out in several places. Today the copies agree. Nothing keeps them in step.

## Details
- **ENOENT check**, 5 copies: `core/write.ts:40`, `core/check.ts:50`, `core/config/resolve.ts:122`, `cli/init/apply.ts:12`, `cli/init/plan.ts:121`. There are also near-identical "read or undefined" wrappers in `write.ts:43`, `check.ts:46`, `apply.ts:15` and `plan.ts:117`.
- **Atomic write** (temp file + rename + cleanup): `core/write.ts:57` and `cli/init/apply.ts:25` are the same function.
- **Diagnostic comparator** (file, then code, then message): `core/compile.ts:76` and `core/build.ts:74`. Diagnostics order is part of deterministic output, so the two must never diverge.
- **`\` to `/` conversion** is inline in `naming.ts:37`, `discover.ts:87`, `watch.ts:55`, `write.ts:38` and `plan.ts:114`, although `toDisplayPath` exists in `collisions.ts:7`. The architecture rules require it for every path.
- **Inconsistent error policy:** reads swallow only ENOENT, but `readdir(...).catch(() => [])` in `check.ts:128` and `plan.ts:238` swallows everything. A permission error on `outDir` makes `check` silently skip stale detection.

## Current behavior
Each module has its own copy. A fix to one copy (for example also treating `ENOTDIR` as missing) won't reach the others.

## Proposed change
Add a small shared module (for example `core/fs.ts`) with `isMissing`, `readIfPresent`, and `replaceFile`. Export one `compareDiagnostics` next to `comparePaths`. Use `toDisplayPath` (or one `toPosix`) everywhere. Make the `readdir` fallbacks ENOENT-only, as the file reads already are.

## Expected benefit
One place to change the determinism and error rules. The `check` path stops hiding permission errors.
