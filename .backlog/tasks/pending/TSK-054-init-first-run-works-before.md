---
id: TSK-054
title: Init: first run works before any icon exists
status: pending
priority: P1
tags: [init, onboarding, cli, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Init: first run works before any icon exists

## Description

Friction found by dogfooding 0.2.1 (2026-10-15). After `npx svgworm init --yes`, `npm run dev` fails in the predev hook with `svgworm: source folder not found: icons` (exit 2), and an empty folder fails with `build/no-icons`. The generated `src/components/icon.tsx` imports `../../svgworm/icons.js`, which does not exist until the first build, so the editor shows errors too. A new user's app is broken until they add icons. Reproduced in Next.js, Astro 7 and Vite 8.

## Acceptance Criteria

- [ ] svgworm init creates the sources folder (default icons/) with one OSS-licensed sample icon when the folder is missing or empty
- [ ] init runs a first build so svgworm/icons.js exists and the generated Icon component type-checks immediately
- [ ] npm run dev and npm run build pass right after install + init in fresh Next.js, Astro and Vite apps (test or fixture-based check)
- [ ] init never overwrites or adds a sample when the folder already has SVG files
- [ ] Docs, llms.txt and both skills reflect the new first-run behavior

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created