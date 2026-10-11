---
id: TSK-008
title: Output contract v0.1
status: complete
priority: P1
tags: [design, contract, adr]
created: 2026-10-07
source: manual
depends-on: [TSK-002, TSK-004, TSK-006]
started: 2026-10-11
completed: 2026-10-11
---

# Output contract v0.1

## Description

Consolidate spike outcomes into docs/output-contract.md with no open markers for v0.1 scope. Scope is one sprite, the manifest (with `color: mono | multicolor`) and types. Multi-sprite (Q-22) and the per-icon delivery field (Q-05) are deferred past v0.1. This is a 0.x contract: breaking changes are allowed with a semver-minor changelog note until 1.0, and the doc states that. Public API — use doubt-driven review.

## Acceptance Criteria

- [x] No open markers left in output-contract.md for v0.1 scope
- [x] 0.x breaking-change policy stated in output-contract.md
- [x] Sample generated output for one fixture set included
- [x] ADR accepted

## Notes

## Learnings

- LRN-023: Task scope text goes stale when later ADRs change a decision
## Progress Log

- [2026-10-07] Created
- [2026-10-11] Started
- [2026-10-11] Output contract v0.1 frozen (docs/output-contract.md) with ADR-0012 accepted. No open markers; 0.x policy stated; sample for the TSK-004 four-icon set in docs/samples/output-contract-v0.1/. Doubt review: no blockers; its findings fixed (publicPath edge cases, symbol sort by name, byte rules, zero icons, img recipe). Scope deviation: per-icon delivery kept in v0.1 (ADR-0006/0010), so TSK-008's Q-05 deferral is stale. Unicode table drift across Node versions noted, not pinned.
- [2026-10-11] Completed