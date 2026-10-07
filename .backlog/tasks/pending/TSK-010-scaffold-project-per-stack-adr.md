---
id: TSK-010
title: Scaffold project per stack ADR
status: pending
priority: P2
tags: [setup]
created: 2026-10-07
source: manual
depends-on: [TSK-009]
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

## Progress Log

- [2026-10-07] Created