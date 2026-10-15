---
id: TSK-046
title: Landing: fix false and inaccurate claims
status: pending
priority: P2
tags: [site, copy]
created: 2026-10-15
source: manual
depends-on: []
---

# Landing: fix false and inaccurate claims

## Description

From the 2026-10-15 site review of https://svgworm.com. These are the claims a skeptical developer checks first, so they cost credibility.

- `apps/site/src/components/Landing.astro:254` says "Open your network panel: no JavaScript, one SVG." The page loads three SVGs: `favicon.svg`, `_astro/logo-light.*.svg` and the sprite.
- The autocomplete mock (`Landing.astro:157`) renders `<Iconname="te`: Astro's HTML compression drops the whitespace between the adjacent spans. It also suggests `shield-check` and `server` for the prefix `te` (`Landing.astro:54`), which no editor would do.
- The hero badge says "Node 22.20+" (`Landing.astro:63`), but the supported range is `^22.20 || >=24.11`, so 23.x and 24.0–24.10 are excluded.
- "Change the text color: ..." (`Landing.astro:292`) reads as an instruction, but the swatches are static on a zero-JS page.
- The agents section says the skills "fix every error code", which overpromises.

## Acceptance Criteria

- [ ] The proof section no longer claims one SVG request: either the copy says one icon sprite or the logo is served from the sprite
- [ ] The autocomplete mock renders <Icon name="te with a space and suggests only names that start with te
- [ ] The hero badge states the real Node range (^22.20 || >=24.11)
- [ ] The color demo copy no longer reads as an instruction the visitor cannot follow
- [ ] The agents section no longer promises the skills fix every error code
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created