---
id: TSK-110
title: Fix: Config paths resolve against cwd, not the config file, though docs say relative to the config
status: complete
priority: P3
tags: []
created: 2026-11-18
source: report/RPT-016
depends-on: []
started: 2026-11-21
completed: 2026-11-21
---

# Fix: Config paths resolve against cwd, not the config file, though docs say relative to the config

## Description

### Description

The `dir` and `sources` descriptions in `packages/svgworm/src/core/config/schema.ts:110` and `:135`, and `apps/site/src/content/docs/config.md:56`, say config paths are relative to the config file. `loadConfig` passes cwd to `resolveConfig` (`packages/svgworm/src/core/config/resolve.ts:250`), so a config loaded with `--config sub/svgworm.config.json` looks for `icons` under cwd and fails with "source folder not found: icons" (reproduction in RPT-016). Decide the base: resolving against the config folder matches the docs but changes behaviour for existing `--config` users; documenting cwd matches ADR-0029's default folder. Start with a failing test. Coordinate with TSK-107, which touches `readConfigFile` in the same file. Gate: `pnpm verify` plus `pnpm example:vite:check`.

## Acceptance Criteria

- [x] A test in packages/svgworm/src/core/config/resolve.test.ts loads a config from another folder through configFile and states where its sources, outDir and moduleDir resolve
- [x] Either config paths resolve against the config file folder, or the schema descriptions, svgworm.schema.json and apps/site/src/content/docs/config.md say they are relative to the working directory
- [x] If the resolution base changes, an ADR records the decision and the Vite plugin configFile option is tested the same way
- [x] llms.txt and the skills in skills/ match the behaviour
- [x] A changeset records the fix

## Notes

## Learnings

- LRN-070: Config paths resolve against cwd, not the config file; schema:generate output needs oxfmt
## Progress Log

- [2026-11-18] Created
- [2026-11-21] Started
- [2026-11-21] criterion 1 — evidence: pnpm exec vitest run src/core/config/resolve.test.ts → new test loads sub/svgworm.config.json via configFile; sources, outDir and moduleDir resolve under cwd (passes) (2026-11-21)
- [2026-11-21] criterion 2 — evidence: chose cwd base (matches ADR-0029, llms.txt, config.md:29, no behaviour change); schema test failed on 'relative to the config', then passed after updating schema.ts, svgworm.schema.json (pnpm schema:generate) and config.md (2026-11-21)
- [2026-11-21] criterion 3 — evidence: not applicable, resolution base unchanged (cwd), so no ADR and no Vite configFile behaviour change (2026-11-21)
- [2026-11-21] criterion 4 — evidence: llms.txt and both skills state relative paths start at the current/project folder, also for a --config in another folder; pnpm site:check → exit 0 (2026-11-21)
- [2026-11-21] criterion 5 — evidence: .changeset/config-paths-relative-to-cwd.md (svgworm patch); pnpm verify → exit 0, pnpm example:vite:check → exit 0 (2026-11-21)
- [2026-11-21] Completed