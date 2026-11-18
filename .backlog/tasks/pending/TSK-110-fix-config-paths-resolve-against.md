---
id: TSK-110
title: Fix: Config paths resolve against cwd, not the config file, though docs say relative to the config
status: pending
priority: P3
tags: []
created: 2026-11-18
source: report/RPT-016
depends-on: []
---

# Fix: Config paths resolve against cwd, not the config file, though docs say relative to the config

## Description

### Description

The `dir` and `sources` descriptions in `packages/svgworm/src/core/config/schema.ts:110` and `:135`, and `apps/site/src/content/docs/config.md:56`, say config paths are relative to the config file. `loadConfig` passes cwd to `resolveConfig` (`packages/svgworm/src/core/config/resolve.ts:250`), so a config loaded with `--config sub/svgworm.config.json` looks for `icons` under cwd and fails with "source folder not found: icons" (reproduction in RPT-016). Decide the base: resolving against the config folder matches the docs but changes behaviour for existing `--config` users; documenting cwd matches ADR-0029's default folder. Start with a failing test. Coordinate with TSK-107, which touches `readConfigFile` in the same file. Gate: `pnpm verify` plus `pnpm example:vite:check`.

## Acceptance Criteria

- [ ] A test in packages/svgworm/src/core/config/resolve.test.ts loads a config from another folder through configFile and states where its sources, outDir and moduleDir resolve
- [ ] Either config paths resolve against the config file folder, or the schema descriptions, svgworm.schema.json and apps/site/src/content/docs/config.md say they are relative to the working directory
- [ ] If the resolution base changes, an ADR records the decision and the Vite plugin configFile option is tested the same way
- [ ] llms.txt and the skills in skills/ match the behaviour
- [ ] A changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-18] Created