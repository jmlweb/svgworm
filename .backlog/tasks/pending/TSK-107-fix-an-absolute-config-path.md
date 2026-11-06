---
id: TSK-107
title: Fix: An absolute --config path is reported as not found although the file exists
status: pending
priority: P4
tags: []
created: 2026-11-06
source: report/RPT-013
depends-on: []
---

# Fix: An absolute --config path is reported as not found although the file exists

## Description

`readConfigFile` in `packages/svgworm/src/core/config/resolve.ts:205` joins `cwd` and `configFile` with `path.join`, so an absolute `--config /abs/file.json` becomes `<cwd>/abs/file.json` and fails with "Config file not found" although the file exists. It affects `build`, `check`, `watch` and the Vite plugin's `configFile`. `init` already rejects absolute paths on purpose (`packages/svgworm/src/cli/init/plan.ts:1479`). Reproduction in RPT-013. Start with a failing test. Gate: `pnpm verify` plus `pnpm example:vite:check` (src/core config loading, no output-contract change).

## Acceptance Criteria

- [ ] A test in packages/svgworm/src/core/config/resolve.test.ts loads a config through an absolute configFile path and states the expected result
- [ ] svgworm build, check and watch either load an absolute --config path or reject it with a message that says it must be relative; never a false "not found"
- [ ] The Vite plugin configFile option behaves the same way, with a test
- [ ] The --config text in packages/svgworm/src/cli/help.ts, apps/site/src/content/docs/cli.md and llms.txt matches the behaviour
- [ ] A changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-06] Created