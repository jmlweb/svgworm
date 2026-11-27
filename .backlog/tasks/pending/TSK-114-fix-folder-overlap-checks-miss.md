---
id: TSK-114
title: Fix: Folder overlap checks miss a child folder whose name starts with two dots, so moduleDir is written into the served outDir
status: pending
priority: P4
tags: []
created: 2026-11-27
source: report/RPT-020
depends-on: []
---

# Fix: Folder overlap checks miss a child folder whose name starts with two dots, so moduleDir is written into the served outDir

## Description

From RPT-020. `isInside` (`packages/svgworm/src/core/config/resolve.ts:48-51`) uses `!path.startsWith('..')`, so `relative('public/icons', 'public/icons/..gen') === '..gen'` counts as outside and `svgworm build --out-dir public/icons --module-dir 'public/icons/..gen'` writes the manifest into the served folder with exit 0. Start with a failing test. The change touches `src/core` config validation, not the output contract: run `pnpm verify`.

## Acceptance Criteria

- [ ] A failing test in packages/svgworm/src/core/config/resolve.test.ts first shows a moduleDir named public/icons/..gen inside outDir public/icons passing validation
- [ ] isInside in packages/svgworm/src/core/config/resolve.ts treats only .. or a ../ segment as leaving the parent, so moduleDir, outDir and sources overlap checks reject ..-prefixed child folders
- [ ] The same predicate in packages/svgworm/src/cli/migrate/project.ts and isOutsideProject in packages/svgworm/src/cli/init/plan.ts are fixed or a test states why they differ
- [ ] pnpm verify passes and a changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-27] Created