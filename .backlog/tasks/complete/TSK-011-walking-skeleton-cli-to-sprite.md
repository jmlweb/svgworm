---
id: TSK-011
title: Walking skeleton: CLI to sprite + manifest + types
status: complete
priority: P2
tags: [core, cli]
created: 2026-10-07
source: manual
depends-on: [TSK-010]
started: 2026-10-11
completed: 2026-10-11
---

# Walking skeleton: CLI to sprite + manifest + types

## Description

Minimal end-to-end core per output contract on fixture corpus: read, normalize, name, optimize, classify color, assemble sprite, emit manifest + types. Programmatic API first, CLI shell over it (R-01..R-23, R-32, R-33, R-50). Inline sprite output is out of v0.1 (R-13, Q-25). Includes config validation (R-32) and stale-sprite cleanup (R-15). Color follows ADR-0004: rules ported from the TSK-003 spike, code rewritten test-first (see LRN-006 on recoloring masks). The CLI shell is minimal: progress, end-of-run stats (icons, sizes, mono vs multicolor counts, timing), `--json`, and stable exit codes (principle 7, R-53, R-56).

## Acceptance Criteria

- [x] Snapshot tests over fixture corpus
- [x] Determinism test passes for shuffled input and NFC/NFD names
- [x] Collision and invalid SVG errors covered; invalid input writes no output (R-04)
- [x] CLI progress, end-of-run stats, `--json` and stable exit codes implemented
- [x] ADR-0004 color rules implemented test-first
- [x] Invalid config rejected with clear errors (R-32)
- [x] Cleanup only removes svgworm-owned files (R-15)
- [x] Build benchmark for 1,000 icons recorded; R-50 budget set

## Notes

## Learnings

- LRN-024: Spike-made contract samples must come from the product pipeline
- LRN-025: oxlint can die with a possible out-of-memory error
## Progress Log

- [2026-10-07] Created
- [2026-10-11] Started
- [2026-10-11] Steps 13-20 done: compile() with events, write/build with R-15 cleanup, icons.test-d.ts, CLI (flags, exit codes 0/1/2), plain/json/clack reporters, real-build fingerprint script, placeholder removed, changeset, bench script.
- [2026-10-11] Output sample regenerated from product code (docs/samples/output-contract-v0.1 sprite, stack, hashes): the TSK-004 spike never ran svgo, so its bytes cannot be reproduced once the pinned svgo preset-default runs. Manifest keys, types, and structure are unchanged. Reason noted in docs/output-contract.md; sample.test.ts now enforces byte equality.
- [2026-10-11] Clack reporter has no tests by design (testing.md exception for CLI visuals); plain and --json outputs are snapshotted instead.
- [2026-10-11] Decision: color override globs match the public name (NFC, "/"); zero icons exits 2; unexpected I/O failure exits 1.
- [2026-10-11] Benchmark (scripts/bench-build.mjs, compile of 1,000 icons, 5 runs after warmup): median 991 ms, p95 992 ms on darwin arm64 Apple M4 Max x14, Node v24.13.0. R-50 budget set to under 3 s on M-series in docs/requirements.md; CI runs a smoke only.
- [2026-10-11] pnpm verify and pnpm typecheck:ts7 pass.
- [2026-10-11] Completed