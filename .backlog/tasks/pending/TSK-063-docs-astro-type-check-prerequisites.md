---
id: TSK-063
title: Docs: Astro type-check prerequisites
status: pending
priority: P3
tags: [docs, astro]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: Astro type-check prerequisites

## Description

Dogfooding 0.2.1 on Astro 7.3.8: "a typo fails astro check" needs @astrojs/check plus typescript; with typescript@latest (7) it fails with "astro check does not currently support TypeScript 7.0". With TS 6 it gives the promised error with "Did you mean".

## Acceptance Criteria

- [ ] Astro guide lists @astrojs/check and a supported TypeScript version for the astro check claim
- [ ] States the TypeScript 7 limitation of astro check while it holds
- [ ] Astro skill updated to match

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created