---
id: TSK-063
title: Docs: Astro type-check prerequisites
status: complete
priority: P3
tags: [docs, astro]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: Astro type-check prerequisites

## Description

Dogfooding 0.2.1 on Astro 7.3.8: "a typo fails astro check" needs @astrojs/check plus typescript; with typescript@latest (7) it fails with "astro check does not currently support TypeScript 7.0". With TS 6 it gives the promised error with "Did you mean".

## Acceptance Criteria

- [x] Astro guide lists @astrojs/check and a supported TypeScript version for the astro check claim — evidence: astro.md step 3: astro check needs @astrojs/check and typescript, with the install command (2026-10-15)
- [x] States the TypeScript 7 limitation of astro check while it holds — evidence: astro.md: as of Astro 7.3 TypeScript 6 only; the TS 7 error text quoted; pin typescript@6 (2026-10-15)
- [x] Astro skill updated to match — evidence: skills/svgworm-astro/SKILL.md fact line updated to match (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset. pnpm site:check passed.
- [2026-10-15] Completed