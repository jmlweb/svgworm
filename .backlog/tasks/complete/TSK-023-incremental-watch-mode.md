---
id: TSK-023
title: Incremental watch mode
status: complete
priority: P3
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-12
completed: 2026-10-12
---

# Incremental watch mode

## Description

Deferred past v0.1. R-30 incremental part and Q-42. v0.1 watch rebuilds everything on change (TSK-013).

## Acceptance Criteria

- [x] Watch rebuilds only changed icons
- [x] Q-42 decided in an ADR

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Added src/core/svg/cache.ts (createTransformCache: SHA-256 over file, symbolId, mode and bytes; sweep of untouched entries), cache option on compile/build/compileFromDisk, watch creates and reuses one. icon events carry fromCache; plain reporter shows (cached).
- [2026-10-12] Evidence: 1,000 fixture icons on M4 Max, Node 24.13: cold 846 ms, warm 10 ms, one changed 10 ms (scratch script cache-bench.mjs). Tests: cache.test.ts (identity, change, rename, mode, failures, sweep) and watch.test.ts incremental case.
- [2026-10-12] ADR-0015 accepted; Q-42 closed, R-30 marked met, README/llms.txt/comparison/skill updated, changeset added. On-disk cache rejected for now (ADR-0015 option 2).
- [2026-10-12] Completed