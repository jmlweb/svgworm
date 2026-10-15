---
id: TSK-055
title: Build hooks for Yarn 2+ (pre/post scripts never run)
status: pending
priority: P1
tags: [init, package-managers, onboarding, cli]
created: 2026-10-15
source: manual
depends-on: []
---

# Build hooks for Yarn 2+ (pre/post scripts never run)

## Description

Dogfooding 0.2.1 with yarn 4.9 (nodeLinker node-modules): `yarn build` ran only the build script, `predev`/`prebuild` were skipped silently, and `public/icons` was never written. Yarn 2+ dropped pre/post hooks for user scripts. init writes those hooks with no warning, so Yarn Berry users ship without a sprite and get no error. npm 11, pnpm 10.34 and yarn 1.22 run the hooks correctly. PnP mode not tested yet; include it.

## Acceptance Criteria

- [ ] init detects Yarn 2+ (packageManager field, .yarnrc.yml or yarn version) and does not rely on predev/prebuild for it
- [ ] For Yarn 2+, init writes the build into the script itself (svgworm && <original command>) or a documented equivalent, idempotently
- [ ] If init cannot rewrite a script safely it prints a clear warning that the hook will not run
- [ ] Tests cover npm, pnpm, yarn 1 and yarn 4 script plans
- [ ] Docs mention the Yarn 2+ behavior

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created