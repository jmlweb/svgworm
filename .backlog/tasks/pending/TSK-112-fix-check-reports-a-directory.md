---
id: TSK-112
title: Fix: check reports a directory or symlink with a sprite-like name as stale, but build never removes it, so check can never pass
status: pending
priority: P4
tags: []
created: 2026-11-21
source: report/RPT-018
depends-on: []
---

# Fix: check reports a directory or symlink with a sprite-like name as stale, but build never removes it, so check can never pass

## Description

From RPT-018. `removeStale` (`packages/svgworm/src/core/write.ts:70`) skips entries that are not regular files; `findStaleSprites` (`packages/svgworm/src/core/check.ts:124`) does not, so `check` flags an entry `build` will never remove. Change touches `src/core`: run the core gate set from `.claude/rules/agent-workflow.md`.

## Acceptance Criteria

- [ ] A failing test first shows check returning upToDate: false for a directory and for a symlink named icons.<hash>.svg in outDir right after a successful build
- [ ] check and build share one predicate for stale entries (regular files with an owned name only), so check passes right after build
- [ ] pnpm verify passes and a changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-21] Created