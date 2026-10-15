---
id: TSK-075
title: Docs: --json output reference
status: pending
priority: P3
tags: [docs, cli, agents]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: --json output reference

## Description

From the 2026-10-15 docs copy review. The docs promise `--json` output for scripts and AI agents (principle 10) but never show its shape, so consumers must reverse-engineer it. TSK-061 changes only the plain reporter, so there is no overlap.

## Acceptance Criteria

- [ ] cli.md documents the JSON document printed by build, check, watch (one per build) and init, with an example of each
- [ ] It states which fields are stable before 1.0 and how changes are announced
- [ ] llms.txt links to it
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created