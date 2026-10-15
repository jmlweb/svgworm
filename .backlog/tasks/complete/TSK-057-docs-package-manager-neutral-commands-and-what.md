---
id: TSK-057
title: Docs: package-manager-neutral commands and what to commit
status: complete
priority: P2
tags: [docs, onboarding, llms, agents]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: package-manager-neutral commands and what to commit

## Description

Dogfooding 0.2.1: every doc is pnpm-only and llms.txt says "Package manager: pnpm", which an agent read as a requirement. npm users must translate. Whether to commit generated files is only stated in the agent skills. The README example uses `home`; lucide calls it `house`, so copying it gives a type error. init says "pass --component to write it anyway" but --help lists only --no-component.

## Acceptance Criteria

- [x] README, site docs (nextjs, astro, cli), llms.txt and both skills show npm commands alongside pnpm (tabs or one neutral block); llms.txt no longer reads as if pnpm is required — evidence: README, nextjs.md, astro.md install blocks carry npm and yarn lines; cli.md says pnpm/npx/yarn/bunx; llms.txt says any package manager with both commands; both skills show the npx form (2026-10-15)
- [x] The svgworm package README has a copy-pasteable install line for svgworm and @svgworm/react — evidence: packages/svgworm/README.md: pnpm add -D svgworm && pnpm add @svgworm/react with the npm form on the same line (2026-10-15)
- [x] Human docs and init next steps say whether to commit public/icons/ and svgworm/ (and the check-in-CI vs prebuild-only trade-off) — evidence: nextjs.md and astro.md: What to commit section with both options and the trade-off; README one-liner; llms.txt step 7; init last next step (plan.ts, plan.test.ts updated, plain-init/json-init snapshots updated) (2026-10-15)
- [x] README and @svgworm/react README examples use an icon name that exists in common sets or explain names come from file names — evidence: README, nextjs.md, astro.md and packages/react/README.md say home is icons/home.svg and names come from file paths (2026-10-15)
- [x] --component appears in --help and the CLI docs, since an init hint tells users to pass it — evidence: help.ts and cli.md init table list --component; llms.txt lists --component / --no-component (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] pnpm site:check passed (5 docs, llms.txt). 491 tests pass; lint, format, typecheck exit 0. Changeset init-commit-hint-and-component-flag.md.
- [2026-10-15] Completed