---
id: TSK-005
title: Spike: TypeScript performance with large icon-name sets
status: complete
priority: P3
tags: [spike, types, adr, post-v0.1]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-12
completed: 2026-10-12
---

# Spike: TypeScript performance with large icon-name sets

## Description

Deferred past v0.1 (TSK-014). v0.1 emits a plain string union; revisit when a user reports more than about 2k icons.

Resolve Q-30. Benchmark tsc check time + editor autocomplete with 500 / 5000 / 20000 names for union, as-const array, namespaced unions.

## Acceptance Criteria

- [x] Benchmark numbers recorded
- [x] Chosen type shape in ADR
- [x] output-contract.md types section updated
- [x] open-questions.md updated
- [x] Learning added

## Notes

## Learnings

- LRN-030: Benchmark consumers must type-check cleanly or the negative control proves nothing
## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] spikes/TSK-005-ts-perf (bench.mjs, results.json, RESULTS.md): union vs tuple vs template at 500/5k/20k names, TS 6.0.3 and 7.0.2, median of 3, plus completion timing; all compiles exit 0 and the negative control fails. ADR-0014 keeps the plain union; output-contract Types section and Q-30 updated; learning LRN-030 on benchmark negative controls.
- [2026-10-12] Completed