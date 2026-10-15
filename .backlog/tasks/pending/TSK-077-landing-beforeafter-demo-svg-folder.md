---
id: TSK-077
title: Landing: before/after demo, SVG folder to sprite to typed icon
status: pending
priority: P2
tags: [site, landing, adoption]
created: 2026-10-15
source: manual
depends-on: []
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

- [ ] The section shows source SVG names, generated output (sprite URL plus IconName usage) and rendered icons, in that order
- [ ] The icons come from the page's real sprite, and the file names match apps/site icons
- [ ] The copy calls it a curated demo, not a live build
- [ ] It works at 360px width with no horizontal page scroll
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created