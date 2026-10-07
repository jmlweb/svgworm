---
id: TSK-011
title: Walking skeleton: CLI to sprite + manifest + types
status: pending
priority: P2
tags: [core, cli]
created: 2026-10-07
source: manual
depends-on: [TSK-010]
---

# Walking skeleton: CLI to sprite + manifest + types

## Description

Minimal end-to-end core per output contract on fixture corpus: read, normalize, name, optimize, classify color, assemble sprite, emit manifest + types. Programmatic API first, CLI shell over it (R-01..R-23, R-32, R-33, R-50). Inline sprite output is out of v0.1 (R-13, Q-25). Includes config validation (R-32) and stale-sprite cleanup (R-15). Color follows ADR-0004: rules ported from the TSK-003 spike, code rewritten test-first (see LRN-006 on recoloring masks). The CLI shell is minimal: progress, end-of-run stats (icons, sizes, mono vs multicolor counts, timing), `--json`, and stable exit codes (principle 7, R-53, R-56).

## Acceptance Criteria

- [ ] Snapshot tests over fixture corpus
- [ ] Determinism test passes for shuffled input and NFC/NFD names
- [ ] Collision and invalid SVG errors covered; invalid input writes no output (R-04)
- [ ] CLI progress, end-of-run stats, `--json` and stable exit codes implemented
- [ ] ADR-0004 color rules implemented test-first
- [ ] Invalid config rejected with clear errors (R-32)
- [ ] Cleanup only removes svgworm-owned files (R-15)
- [ ] Build benchmark for 1,000 icons recorded; R-50 budget set

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created