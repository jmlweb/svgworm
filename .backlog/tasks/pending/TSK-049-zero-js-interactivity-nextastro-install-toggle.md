---
id: TSK-049
title: Zero-JS interactivity: Next/Astro install toggle and live color demo
status: pending
priority: P3
tags: [site, ux]
created: 2026-10-15
source: manual
depends-on: []
---

# Zero-JS interactivity: Next/Astro install toggle and live color demo

## Description

From the 2026-10-15 site review. The hero install command (`apps/site/src/components/Install.astro`) is React-only, but the secondary CTA targets Astro, so Astro visitors copy the wrong command. Either show `pnpm add -D svgworm` alone or add a CSS-only Next/Astro toggle. The color demo is static; making it live with radio inputs and `:has()` proves the per-icon color claim with zero JS, which fits the pitch.

## Acceptance Criteria

- [ ] An Astro visitor can see and select an install command without @svgworm/react
- [ ] The color demo lets the visitor pick a color with radio inputs and :has(), and the mono icon follows while the multicolor icon keeps its colors
- [ ] The page still ships 0 B of JavaScript
- [ ] Both controls are keyboard-accessible and labelled

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created