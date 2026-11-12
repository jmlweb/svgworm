---
id: TSK-109
title: Fix: Absolute outDir and moduleDir are written under cwd, and an absolute source is reported as not found
status: pending
priority: P3
tags: [core, config, paths]
created: 2026-11-12
source: report/RPT-015
depends-on: []
---

# Fix: Absolute outDir and moduleDir are written under cwd, and an absolute source is reported as not found

## Description

### Description

The core joins configured paths onto `cwd` with `path.join` (`packages/svgworm/src/core/write.ts:36`, `:61`, `:96`; `discover.ts:107`; `check.ts:96`, `:117`, `:146`; `watch.ts:146`), so an absolute `outDir` or `moduleDir` is written to `<cwd>/<abs path>` and the build exits 0, while an absolute `sources` entry fails with "source folder not found". `resolveConfig` (`config/resolve.ts:113-128`) validates the same paths with `path.resolve`, so its overlap checks look at different folders than the build uses. Reproduction in RPT-015. Decide between resolving with `path.resolve(cwd, p)` everywhere or rejecting absolute paths; align with the decision for `--config` in TSK-107 (same `join` mistake, `resolve.ts:205`). Start with a failing test. Gate: `src/core` change, so `pnpm verify`, `pnpm determinism:fingerprint`, `pnpm example:check`, `pnpm example:vite:check`, `pnpm site:check`.

## Acceptance Criteria

- [ ] A test in packages/svgworm/src/core reproduces an absolute outDir, moduleDir and sources entry and states the expected result
- [ ] build, check and watch either use absolute sources, outDir and moduleDir as given or reject them in resolveConfig with a message that says they must be relative; never a write to a mirrored path under cwd
- [ ] The overlap checks in resolveConfig and the paths used by write, discover, check and watch resolve the same folders
- [ ] apps/site/src/content/docs/config.md, apps/site/src/content/docs/cli.md and llms.txt match the behaviour
- [ ] A changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-12] Created