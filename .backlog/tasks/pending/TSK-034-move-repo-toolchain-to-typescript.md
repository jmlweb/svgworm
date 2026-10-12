---
id: TSK-034
title: Move repo toolchain to TypeScript 7 at 7.1
status: pending
priority: P3
tags: [tooling, typescript]
created: 2026-10-11
source: ADR-0011
depends-on: []
---

# Move repo toolchain to TypeScript 7 at 7.1

## Description

ADR-0011 keeps builds and type checks on TypeScript 6.0 and drops the typescript-eslint blocker (type-aware lint now runs on oxlint-tsgolint). Revisit at TS 7.1: switch typescript, tsc build and typecheck, keep typecheck:ts7 or its TS 6 mirror as needed, check @jmlweb/tsconfig-* peer ranges and publint/attw.

## Acceptance Criteria

- [ ] Decide TS 7.1 move or defer, with evidence
- [ ] typecheck, build, tests and check:packages pass on TS 7
- [ ] ADR-0011 follow-up noted or superseding ADR written if the stack row changes

## Notes

## Learnings

## Progress Log

- [2026-10-11] Created
- [2026-10-12] 2026-10-12: TypeScript 7.1 is not released (npm latest 7.0.2, next 7.1.0-dev.20261011.1). Nothing to decide yet; revisit when 7.1 ships. typecheck:ts7 still runs 7.0.2 in CI.