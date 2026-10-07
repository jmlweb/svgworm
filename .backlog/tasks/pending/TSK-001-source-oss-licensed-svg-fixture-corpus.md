---
id: TSK-001
title: Source OSS-licensed SVG fixture corpus
status: pending
priority: P1
tags: [fixtures, testing]
created: 2026-10-07
source: docs/viability.md
depends-on: []
---

# Source OSS-licensed SVG fixture corpus

## Description

Build fixtures/ with MIT/ISC/Apache/CC0 icons covering all cases in .claude/rules/testing.md (mono, stroke, multicolor, gradients, masks, clipPath, filters, nested svg, style blocks, internal refs, duplicates across folders, non-ASCII names, invalid SVG). Old svg/ folder is proprietary — never use.

## Acceptance Criteria

- [ ] fixtures/ covers every case listed in .claude/rules/testing.md
- [ ] fixtures/LICENSES.md lists source + license per icon
- [ ] Each fixture category has a short README note on what it tests

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created