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

Minimal end-to-end core per output contract on fixture corpus: read, normalize, name, optimize, classify color, assemble sprite, emit manifest + types. Programmatic API first, CLI shell over it (R-01..R-23, R-32, R-33, R-50). Includes inline sprite output (R-13), config validation (R-32), stale-sprite cleanup (R-15).

## Acceptance Criteria

- [ ] Snapshot tests over fixture corpus
- [ ] Determinism test with shuffled input passes
- [ ] Collision and invalid SVG errors covered; invalid input writes no output (R-04)
- [ ] Inline sprite output emitted when enabled (R-13)
- [ ] Invalid config rejected with clear errors (R-32)
- [ ] Cleanup only removes svgworm-owned files (R-15)
- [ ] Build benchmark for 1,000 icons recorded; R-50 budget set

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created