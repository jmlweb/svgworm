---
id: TSK-064
title: Naming: split camelCase/PascalCase file names into kebab-case
status: pending
priority: P4
tags: [naming, output-contract, adr]
created: 2026-10-15
source: manual
depends-on: []
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