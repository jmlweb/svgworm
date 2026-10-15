---
id: TSK-064
title: Naming: split camelCase/PascalCase file names into kebab-case
status: pending
priority: P4
tags: [naming, output-contract, adr]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
---

# Naming: split camelCase/PascalCase file names into kebab-case

## Description

Dogfooding 0.2.1: `ArrowRight.svg` becomes `arrowright`. Figma and many designer exports use PascalCase, so names are hard to guess. Public-name change, so it needs an ADR.

## Acceptance Criteria

- [ ] ADR decides whether ArrowRight.svg becomes arrow-right (today arrowright)
- [ ] If accepted, naming tests and the output contract are updated with a semver note and changeset

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Stopped on request. ADR-0021 drafted as proposed (docs/adr/0021-no-camel-case-splitting-warn-when-case-carried-meaning.md): keep ADR-0007 naming, add a name/case-folded warning with a suggested file name. Not done yet: the warning in core/naming.ts + compile.ts, tests, troubleshooting and skill table rows, changeset (minor), ADR status to accepted.
- [2026-10-15] Returned to pending