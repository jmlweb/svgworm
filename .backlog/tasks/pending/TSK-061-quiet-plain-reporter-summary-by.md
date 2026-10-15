---
id: TSK-061
title: Quiet plain reporter: summary by default, --verbose for per-icon lines
status: pending
priority: P3
tags: [cli, ux, reporters]
created: 2026-10-15
source: manual
depends-on: []
---

# Quiet plain reporter: summary by default, --verbose for per-icon lines

## Description

Dogfooding 0.2.1: the plain reporter prints `icon <name> <color> <delivery>` per icon on every build and check. With lucide it is 2,166 lines in each CI or predev run. Both agents flagged it as noise.

## Acceptance Criteria

- [ ] Plain build output prints the summary and diagnostics, not one line per icon, by default
- [ ] check prints the verdict without per-icon lines when up to date
- [ ] A --verbose flag (or equivalent) restores per-icon lines
- [ ] --json output is unchanged
- [ ] Non-TTY snapshots updated; docs and help updated

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created