---
id: TSK-060
title: Init: monorepo sources, re-init flags, prompt labels
status: complete
priority: P3
tags: [init, monorepo, cli, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Init: monorepo sources, re-init flags, prompt labels

## Description

Dogfooding 0.2.1: `init --source ../../packages/icons/svg` fails with "must point inside the project folder" while build accepts the same path. `init` from `src/` writes `src/svgworm.config.json` and skips the component. The Astro next step "run init with --public-path <base>/icons" is skipped once a config exists ("exists with different content; edit it by hand"). An interactive answer is labeled `framework: astro (flag)`.

## Acceptance Criteria

- [x] init --source accepts a folder outside the project (as build and check already do), or the restriction is justified in docs — evidence: plan.test.ts: accepts a source folder outside the project; absolute sources still rejected; sample never written outside (never writes the sample icon into a source folder outside the project) → pass (2026-10-15)
- [x] init run from a subdirectory finds the nearest package.json root or says where it is writing — evidence: run.test.ts: refuses to run from a subfolder of a package and names the package root (exit 2, nothing written) → pass (2026-10-15)
- [x] Re-running init with --public-path on an existing config either updates it or the Astro base hint says to edit publicPath by hand — evidence: plan.ts Astro hint now says to set publicPath in svgworm.config.json; plan.test.ts names the Astro import and the base hint → pass (2026-10-15)
- [x] After an interactive framework choice init reports (prompt), not (flag) — evidence: FrameworkSource.PROMPT set by askInitOptions when the select was shown; plan.test.ts reports a framework chosen at a prompt as such → pass (2026-10-15)
- [x] Tests cover each case — evidence: pnpm vitest run → 491 passed; snapshots plain-init.txt/json-init.json updated (component wording for react-only projects) (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Also covers TSK-058 criteria 2 and 3 (Server Component / Next basePath wording only with next). Docs cli.md and svgworm-astro skill list prompt as a frameworkSource. Changeset init-monorepo-and-prompts.md. lint, format, typecheck exit 0.
- [2026-10-15] Completed