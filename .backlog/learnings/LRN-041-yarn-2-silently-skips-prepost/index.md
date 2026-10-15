---
id: LRN-041
title: Yarn 2+ silently skips pre/post scripts; detect Berry and prefix dev/build
status: active
tags: [package-managers, yarn, init, cli]
task: TSK-055
created: 2026-10-15
---

## Context
`svgworm init` wired the build through `predev`/`prebuild`. Dogfooding with yarn 4.9 left `public/icons` unwritten with no error.

## Insight
Yarn 2+ (Berry, node-modules and PnP alike) never runs `pre<name>`/`post<name>` for user scripts; npm, pnpm and Yarn 1 do. Berry signals, in order: `packageManager: yarn@>=2` (wins over files), `.yarnrc.yml`, a `yarn.lock` whose head has `__metadata:` (classic says `yarn lockfile v1`). Workspace packages carry none of these locally, so walk up to the repo root (`.git`), skipping the home folder (global `~/.yarnrc.yml`). Prefixing `svgworm && ` is only safe on plain commands, pipes, redirects and `&&` chains; `||`, `;` and a lone `&` change semantics.

## Application
Any tool that hooks into package.json lifecycle must not rely on pre/post scripts for Yarn 2+. Don't spawn `yarn --version` to detect it (Corepack may prompt or download). Warn loudly when a script cannot be rewritten.
