---
id: TSK-060
title: Init: monorepo sources, re-init flags, prompt labels
status: pending
priority: P3
tags: [init, monorepo, cli, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Init: monorepo sources, re-init flags, prompt labels

## Description

Dogfooding 0.2.1: `init --source ../../packages/icons/svg` fails with "must point inside the project folder" while build accepts the same path. `init` from `src/` writes `src/svgworm.config.json` and skips the component. The Astro next step "run init with --public-path <base>/icons" is skipped once a config exists ("exists with different content; edit it by hand"). An interactive answer is labeled `framework: astro (flag)`.

## Acceptance Criteria

- [ ] init --source accepts a folder outside the project (as build and check already do), or the restriction is justified in docs
- [ ] init run from a subdirectory finds the nearest package.json root or says where it is writing
- [ ] Re-running init with --public-path on an existing config either updates it or the Astro base hint says to edit publicPath by hand
- [ ] After an interactive framework choice init reports (prompt), not (flag)
- [ ] Tests cover each case

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created