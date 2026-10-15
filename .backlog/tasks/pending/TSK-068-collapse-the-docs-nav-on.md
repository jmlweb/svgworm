---
id: TSK-068
title: Collapse the docs nav on mobile
status: pending
priority: P2
tags: [site, docs, design, mobile]
created: 2026-10-15
source: manual
depends-on: []
---

# Collapse the docs nav on mobile

## Description

From the 2026-10-15 docs design critique (Playwright at 1440 and 390). At 800px and below the whole docs sidebar renders as wrapping link chips above the content, so the h1 starts about 356px down on an 844px phone screen (it was 460-570px before the TOC specificity fix). Put the page list behind a `<details>` "Docs menu" so the content comes first, with no client JS.

The CLI help block in `apps/site/src/content/docs/cli.md` mirrors `svgworm --help`, so its description column is cut off on phones; render the options as a table there or find another readable form. The Astro cache-headers table in `astro.md` scrolls inside itself and wraps inline code in narrow cells.

## Acceptance Criteria

- [ ] At 390x844 the h1 starts in the top ~200px (the page list sits behind a <details> Docs menu, no JS)
- [ ] The CLI help block in cli.md is readable at 390px with no clipped descriptions
- [ ] The Astro cache-headers table in astro.md is readable at 390px without inline code in narrow cells
- [ ] No page scrolls horizontally at 390px
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created