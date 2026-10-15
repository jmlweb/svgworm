---
id: TSK-077
title: Landing: before/after demo, SVG folder to sprite to typed icon
status: complete
priority: P2
tags: [site, landing, adoption]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Landing: before/after demo, SVG folder to sprite to typed icon

## Description

The landing-page design critique (2026-10-15) says the page shows only the end result. Nothing shows the change from input to output.

Add a section that walks through three steps:

- a few source SVGs with their file names
- the generated sprite reference and typed `<Icon name>` usage
- the rendered icons, with a visible type error for a wrong name

It is curated and static. The compiler does not run in the browser, and the section says it is a demo build. The site may use client JS (principle 1 binds only generated output), but the default is no script.

## Acceptance Criteria

- [x] The section shows source SVG names, generated output (sprite URL plus IconName usage) and rendered icons, in that order
- [x] The icons come from the page's real sprite, and the file names match apps/site icons
- [x] The copy calls it a curated demo, not a live build
- [x] It works at 360px width with no horizontal page scroll
- [x] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-077. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: #demo section after the stats band: real file names from apps/site/icons (build throws if missing from the manifest), real sprite URL + IconName sample + typed usage with a visible type error for 'termnial', rendered icons through the generated Icon.astro; copy says 'A curated demo, not a live build'; no page scroll at 360px; axe clean; no script.
- [2026-10-15] Completed