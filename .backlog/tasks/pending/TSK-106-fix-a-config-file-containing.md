---
id: TSK-106
title: Fix: A config file containing JSON null is accepted as an empty config
status: pending
priority: P4
tags: []
created: 2026-11-03
source: report/RPT-012
depends-on: []
---

# Fix: A config file containing JSON null is accepted as an empty config

## Description

`loadConfig` (`packages/svgworm/src/core/config/resolve.ts:240-243`) uses `fromFile ?? { ...overrides }`, so a file containing `null` skips zod and the build runs on defaults (exit 0), while `42` or `[]` exit 2. Distinguish "file missing" (`undefined`) from "file is null" so null reaches `configSchema`. Core config change: write the failing test first. See RPT-012.

## Acceptance Criteria

- [ ] A test in resolve.test.ts loads a config file containing null and expects a ConfigError
- [ ] svgworm build with a null svgworm.config.json exits 2 with Invalid configuration
- [ ] Non-object configs (42, [], false) still exit 2 and object configs behave as before
- [ ] A changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-03] Created