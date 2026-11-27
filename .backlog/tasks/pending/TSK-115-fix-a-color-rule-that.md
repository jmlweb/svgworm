---
id: TSK-115
title: Fix: A color rule that matches no icon is silently ignored, for example a file-style brand/*.svg glob
status: pending
priority: P4
tags: []
created: 2026-11-27
source: report/RPT-021
depends-on: []
---

# Fix: A color rule that matches no icon is silently ignored, for example a file-style brand/*.svg glob

## Description

From RPT-021. `resolveColorMode` (`packages/svgworm/src/core/svg/color/overrides.ts:13`) applies the last matching rule; a rule that matches nothing is dropped silently (exit 0, `warnings: []`). Emit a warning through the existing diagnostic path in `packages/svgworm/src/core/compile.ts`. Deciding whether an `exclude` glob that matches nothing should warn too is in scope only if it stays one small change; otherwise file a follow-up. Touches `src/core` (warnings only, output files unchanged): run `pnpm verify` and `pnpm determinism:fingerprint`.

## Acceptance Criteria

- [ ] A failing test first shows that a color rule matching no icon (brand/*.svg against icon brand/logo) produces a warning diagnostic
- [ ] The warning names the rule and, when its glob ends in .svg, says that rules match icon names without the extension; the build still succeeds
- [ ] Plain and --json reporter snapshots cover the warning
- [ ] A changeset records the change, and apps/site/src/content/docs/config.md, llms.txt and the skills mention the warning if they describe color rules

## Notes

## Learnings

## Progress Log

- [2026-11-27] Created