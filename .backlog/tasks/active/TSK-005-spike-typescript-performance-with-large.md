---
id: TSK-005
title: Spike: TypeScript performance with large icon-name sets
status: active
priority: P3
tags: [spike, types, adr, post-v0.1]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-12
---

# Spike: TypeScript performance with large icon-name sets

## Description

Deferred past v0.1 (TSK-014). v0.1 emits a plain string union; revisit when a user reports more than about 2k icons.

Resolve Q-30. Benchmark tsc check time + editor autocomplete with 500 / 5000 / 20000 names for union, as-const array, namespaced unions.

## Acceptance Criteria

- [ ] Benchmark numbers recorded
- [ ] Chosen type shape in ADR
- [ ] output-contract.md types section updated
- [ ] open-questions.md updated
- [ ] Learning added

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started