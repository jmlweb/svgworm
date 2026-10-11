---
id: TSK-010
title: Scaffold project per stack ADR
status: active
priority: P2
tags: [setup]
created: 2026-10-07
source: manual
depends-on: [TSK-009]
started: 2026-10-07
---

# Scaffold project per stack ADR

## Description

Create package(s), lint/format/test/build, CI (lint, test, typecheck, determinism check). Update AGENTS.md with commands.

## Acceptance Criteria

- [ ] Fresh clone: install + test + build pass
- [ ] CI runs on PR on Linux, macOS and Windows
- [ ] Determinism check runs on all three operating systems
- [ ] AGENTS.md lists commands

## Notes

## Learnings

- LRN-020: Scaffold gotchas: typescript-eslint 8.70 config API, TS 7 via pnpm dlx, Prettier rewrites docs
- LRN-021: Worktree agents: rtk-rewritten git commands are refused; use /usr/bin/env git
- LRN-022: Oxlint config gotchas: no extends in overrides, no restricted-properties, typeAware root-only
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started