---
id: TSK-046
title: Landing: fix false and inaccurate claims
status: complete
priority: P2
tags: [site, copy]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
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

- [x] The proof section no longer claims one SVG request: either the copy says one icon sprite or the logo is served from the sprite — evidence: grep dist/index.html → "one icon sprite" count 1 (2026-10-15)
- [x] The autocomplete mock renders <Icon name="te with a space and suggests only names that start with te — evidence: built dist/index.html suggest-input → "te" with `<Icon` + space, suggestions only `terminal` (2026-10-15)
- [x] The hero badge states the real Node range (^22.20 || >=24.11) — evidence: grep dist/index.html → "Node ^22.20 || >=24.11" (2026-10-15)
- [x] The color demo copy no longer reads as an instruction the visitor cannot follow — evidence: manual: Landing.astro copy now "Each swatch sets a different text color…" (2026-10-15)
- [x] The agents section no longer promises the skills fix every error code — evidence: manual: Landing.astro agents copy now "explain each diagnostic code with its fix", matching SKILL.md tables (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check → exit 0, "checked 21 file(s) and 7 page(s)" (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Proof copy says "one icon sprite" (the logo and favicon stay separate files). Autocomplete mock: explicit space after `<Icon`, suggestions cut to `terminal`, the only site icon starting with `te`. Hero badge: `Node ^22.20 || >=24.11`. Color demo: "Each swatch sets a different text color". Agents: skills "explain each diagnostic code with its fix", matching the SKILL.md tables. Verified in built HTML; `pnpm site:check` passes. No tests added: copy-only change, covered by site:check.
- [2026-10-15] Completed
