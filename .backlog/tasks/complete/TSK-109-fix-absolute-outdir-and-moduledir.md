---
id: TSK-109
title: Fix: Absolute outDir and moduleDir are written under cwd, and an absolute source is reported as not found
status: complete
priority: P3
tags: [core, config, paths]
created: 2026-11-12
source: report/RPT-015
depends-on: []
started: 2026-11-15
completed: 2026-11-15
---

# Fix: Absolute outDir and moduleDir are written under cwd, and an absolute source is reported as not found

## Description

### Description

The core joins configured paths onto `cwd` with `path.join` (`packages/svgworm/src/core/write.ts:36`, `:61`, `:96`; `discover.ts:107`; `check.ts:96`, `:117`, `:146`; `watch.ts:146`), so an absolute `outDir` or `moduleDir` is written to `<cwd>/<abs path>` and the build exits 0, while an absolute `sources` entry fails with "source folder not found". `resolveConfig` (`config/resolve.ts:113-128`) validates the same paths with `path.resolve`, so its overlap checks look at different folders than the build uses. Reproduction in RPT-015. Decide between resolving with `path.resolve(cwd, p)` everywhere or rejecting absolute paths; align with the decision for `--config` in TSK-107 (same `join` mistake, `resolve.ts:205`). Start with a failing test. Gate: `src/core` change, so `pnpm verify`, `pnpm determinism:fingerprint`, `pnpm example:check`, `pnpm example:vite:check`, `pnpm site:check`.

## Acceptance Criteria

- [x] A test in packages/svgworm/src/core reproduces an absolute outDir, moduleDir and sources entry and states the expected result
- [x] build, check and watch either use absolute sources, outDir and moduleDir as given or reject them in resolveConfig with a message that says they must be relative; never a write to a mirrored path under cwd
- [x] The overlap checks in resolveConfig and the paths used by write, discover, check and watch resolve the same folders
- [x] apps/site/src/content/docs/config.md, apps/site/src/content/docs/cli.md and llms.txt match the behaviour
- [x] A changeset records the fix

## Notes

## Learnings

- LRN-067: path.join(cwd, p) mirrors an absolute p under cwd; resolve configured paths with path.resolve
- LRN-068: Local gate noise: Next 16.4.0 SecurityFatalError on first build, Vue conformance fails on Node 25
## Progress Log

- [2026-11-12] Created
- [2026-11-15] Started
- [2026-11-15] criterion 1 — evidence: packages/svgworm/src/core/absolute-paths.test.ts (absolute sources, outDir, moduleDir outside cwd; build, check and watch use them as given, nothing under cwd) failed before the fix (3 of 4: 'source folder not found'), pnpm vitest run src/core → 465 passed after (2026-11-15)
- [2026-11-15] criterion 2 — evidence: decision is resolve as given (derivePublicPath already supports an absolute outDir; TSK-107 is undecided and resolving --config would align). write/discover/check/watch use path.resolve(cwd, p); RPT-015 repro with built CLI: build --out-dir O --public-path /icons --module-dir M → exit 0, files in O and M, cwd holds only icons/a.svg; build/check --source S → exit 0 / up to date (2026-11-15)
- [2026-11-15] criterion 3 — evidence: resolveConfig returns cwd: resolve(cwd) and checks overlaps with resolve(cwd, p); write, discover, check and watch now compute resolve(config.cwd, p) on the same values, so both see the same folders. The build/check/watch tests in absolute-paths.test.ts failed before and pass now; its overlap test proves absolute overlaps are rejected (2026-11-15)
- [2026-11-15] criterion 4 — evidence: config.md, cli.md and llms.txt (plus both skills) state relative paths start at the project folder and absolute paths are used as given; pnpm site:check → exit 0 (2026-11-15)
- [2026-11-15] criterion 5 — evidence: .changeset/absolute-output-paths.md (svgworm patch) (2026-11-15)
- [2026-11-15] Completed