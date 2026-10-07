---
id: TSK-001
title: Source OSS-licensed SVG fixture corpus
status: complete
priority: P1
tags: [fixtures, testing]
created: 2026-10-07
source: docs/viability.md
depends-on: []
started: 2026-10-07
completed: 2026-10-07
---

# Source OSS-licensed SVG fixture corpus

## Description

Build fixtures/ with MIT/ISC/Apache/CC0 icons covering all cases in .claude/rules/testing.md (mono, stroke, multicolor, gradients, masks, clipPath, filters, nested svg, style blocks, internal refs, duplicates across folders, non-ASCII names, invalid SVG). Old svg/ folder is proprietary — never use.

## Acceptance Criteria

- [x] fixtures/ covers every case listed in .claude/rules/testing.md
- [x] fixtures/LICENSES.md lists source + license per icon
- [x] Each fixture category has a short README note on what it tests

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-07] fixtures/ added: 34 files in 14 categories covering every testing.md case (mono, stroke, mixed, multicolor, gradient, mask, clipPath, filter, nested svg, style, internal refs, duplicates, non-ASCII, invalid). Sourced from pinned OSS packages (MIT/ISC/CC0) plus CC0 self-authored. LICENSES.md lists source, version, license, copyright notices. README.md notes what each category tests and the expected behavior. All criteria met
- [2026-10-07] Completed