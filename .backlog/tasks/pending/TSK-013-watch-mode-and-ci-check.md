---
id: TSK-013
title: Watch mode and CI check mode
status: pending
priority: P3
tags: [cli, dx]
created: 2026-10-07
source: manual
depends-on: [TSK-011]
---

# Watch mode and CI check mode

## Description

R-31 in v0.1: check mode exits non-zero if committed output is stale. R-30 in v0.1: watch rebuilds everything on change, which is fast enough under the R-50 budget and what `next dev` needs. Incremental watch is a new post-v0.1 task. Cleanup (R-15) lives in TSK-011.

## Acceptance Criteria

- [ ] Watch rebuilds everything on change (v0.1); incremental watch is post-v0.1
- [ ] check exits 1 on stale output with diff summary

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created