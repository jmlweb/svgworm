---
id: TSK-049
title: Zero-JS interactivity: Next/Astro install toggle and live color demo
status: complete
priority: P3
tags: [site, ux]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Zero-JS interactivity: Next/Astro install toggle and live color demo

## Description

From the 2026-10-15 site review. The hero install command (`apps/site/src/components/Install.astro`) is React-only, but the secondary CTA targets Astro, so Astro visitors copy the wrong command. Either show `pnpm add -D svgworm` alone or add a CSS-only Next/Astro toggle. The color demo is static; making it live with radio inputs and `:has()` proves the per-icon color claim with zero JS, which fits the pitch.

## Acceptance Criteria

- [x] An Astro visitor can see and select an install command without @svgworm/react — evidence: Install.astro: Next.js/Astro radio switch with :has(); Playwright with JavaScript disabled in Chromium, Firefox and WebKit: clicking Astro hides the @svgworm/react command and shows pnpm add -D svgworm (2026-10-15)
- [x] The color demo lets the visitor pick a color with radio inputs and :has(), and the mono icon follows while the multicolor icon keeps its colors — evidence: Landing color demo: four radio swatches, :has() sets color on the stage; computed color of .color-stage goes from rgb(147,58,67) to rgb(61,122,92) on click and to sienna on ArrowRight, in all three engines with JS off (2026-10-15)
- [x] The page still ships 0 B of JavaScript — evidence: dist/_astro has no .js file and index.html has no <script src>; the one inline script is the pre-existing worm pause control (WCAG 2.2.2), unchanged (2026-10-15)
- [x] Both controls are keyboard-accessible and labelled — evidence: fieldset + visually-hidden legend for both groups, every swatch has a visually hidden label, radios are native (Tab, arrows); focus-visible ring on both controls (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] pnpm site:check passed. Screenshots of the hero and the color demo at 1440 and 390 reviewed.
- [2026-10-15] Completed