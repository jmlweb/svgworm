---
id: TSK-055
title: Build hooks for Yarn 2+ (pre/post scripts never run)
status: complete
priority: P1
tags: [init, package-managers, onboarding, cli]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Build hooks for Yarn 2+ (pre/post scripts never run)

## Description

Dogfooding 0.2.1 with yarn 4.9 (nodeLinker node-modules): `yarn build` ran only the build script, `predev`/`prebuild` were skipped silently, and `public/icons` was never written. Yarn 2+ dropped pre/post hooks for user scripts. init writes those hooks with no warning, so Yarn Berry users ship without a sprite and get no error. npm 11, pnpm 10.34 and yarn 1.22 run the hooks correctly. PnP mode not tested yet; include it.

## Acceptance Criteria

- [x] init detects Yarn 2+ (packageManager field, .yarnrc.yml or yarn version) and does not rely on predev/prebuild for it — evidence: plan.test.ts "inspectProject: Yarn 2+ detection" (packageManager, .yarnrc.yml, Berry yarn.lock, workspace root walk, .git stop) → pnpm test exit 0 (2026-10-15) (2026-10-15)
- [x] For Yarn 2+, init writes the build into the script itself (svgworm && <original command>) or a documented equivalent, idempotently — evidence: plan.test.ts yarn 4 cases (prefix, idempotent re-run, earlier pre scripts, custom config) + manual: yarn 4.9.2 nodeLinker pnp, init prefixed dev/build, yarn build wrote public/icons, re-init unchanged → pass (2026-10-15) (2026-10-15)
- [x] If init cannot rewrite a script safely it prints a clear warning that the hook will not run — evidence: plan.test.ts warn cases + run.test.ts plain stderr and --json action.warning → pnpm test exit 0 (2026-10-15) (2026-10-15)
- [x] Tests cover npm, pnpm, yarn 1 and yarn 4 script plans — evidence: plan.test.ts "package.json scripts per package manager" npm/pnpm/yarn 1/yarn 4 → pnpm test 500 passed (2026-10-15) (2026-10-15)
- [x] Docs mention the Yarn 2+ behavior — evidence: apps/site/src/content/docs/cli.md ### Yarn 2+, nextjs.md and astro.md manual steps, llms.txt, both skills SKILL.md step 2 (2026-10-15) (2026-10-15)

## Notes

## Learnings

- LRN-041: Yarn 2+ silently skips pre/post scripts; detect Berry and prefix dev/build
## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Implemented in 1e9c778 and b86d1f7: runsScriptHooks fact (Yarn 2+ detection walks up to the repo root, skips homedir); planScripts prefixes dev/build with `svgworm &&` on Berry, warns via new InitAction.warning (plain stderr, clack log.warn, --json action field); nextSteps/AGENTS.md no longer claim svgworm runs before dev/build when it does not (also fixed for --no-scripts and no package.json).
- [2026-10-15] PnP dogfood: yarn 4.9.2, nodeLinker pnp, packed svgworm tarball → init updated scripts, `yarn build` regenerated public/icons and svgworm/, second init → package.json unchanged.
- [2026-10-15] Known gaps: unsafe-prefix check is regex-based (quoted ; or & triggers a fail-safe warning); Bun pre-script behavior not verified; pnpm with enable-pre-post-scripts=false not handled; Windows tmpdir 8.3 path vs homedir skip untested. pnpm test 500 passed, lint/typecheck exit 0.
- [2026-10-15] Completed