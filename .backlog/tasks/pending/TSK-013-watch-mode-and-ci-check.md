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

R-30, R-31. Incremental rebuild on change; check mode exits non-zero if committed output stale. Cleanup (R-15) lives in TSK-011.

## Acceptance Criteria

- [ ] Watch rebuilds only changed icons
- [ ] check exits 1 on stale output with diff summary

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created