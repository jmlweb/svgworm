---
id: TSK-057
title: Docs: package-manager-neutral commands and what to commit
status: pending
priority: P2
tags: [docs, onboarding, llms, agents]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: package-manager-neutral commands and what to commit

## Description

Dogfooding 0.2.1: every doc is pnpm-only and llms.txt says "Package manager: pnpm", which an agent read as a requirement. npm users must translate. Whether to commit generated files is only stated in the agent skills. The README example uses `home`; lucide calls it `house`, so copying it gives a type error. init says "pass --component to write it anyway" but --help lists only --no-component.

## Acceptance Criteria

- [ ] README, site docs (nextjs, astro, cli), llms.txt and both skills show npm commands alongside pnpm (tabs or one neutral block); llms.txt no longer reads as if pnpm is required
- [ ] The svgworm package README has a copy-pasteable install line for svgworm and @svgworm/react
- [ ] Human docs and init next steps say whether to commit public/icons/ and svgworm/ (and the check-in-CI vs prebuild-only trade-off)
- [ ] README and @svgworm/react README examples use an icon name that exists in common sets or explain names come from file names
- [ ] --component appears in --help and the CLI docs, since an init hint tells users to pass it

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created