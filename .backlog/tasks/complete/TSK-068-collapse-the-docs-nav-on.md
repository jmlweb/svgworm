---
id: TSK-068
title: Collapse the docs nav on mobile
status: complete
priority: P2
tags: [site, docs, design, mobile]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Collapse the docs nav on mobile

## Description

From the 2026-10-15 docs design critique (Playwright at 1440 and 390). At 800px and below the whole docs sidebar renders as wrapping link chips above the content, so the h1 starts about 356px down on an 844px phone screen (it was 460-570px before the TOC specificity fix). Put the page list behind a `<details>` "Docs menu" so the content comes first, with no client JS.

The CLI help block in `apps/site/src/content/docs/cli.md` mirrors `svgworm --help`, so its description column is cut off on phones; render the options as a table there or find another readable form. The Astro cache-headers table in `astro.md` scrolls inside itself and wraps inline code in narrow cells.

## Acceptance Criteria

- [x] At 390x844 the h1 starts in the top ~200px (the page list sits behind a <details> Docs menu, no JS) — evidence: Playwright Chromium 390x844: h1 top 171px on every docs page (was 436); DocsNav.astro wraps the page list in <details class=docs-menu>, closed on phones via ::details-content, open with the summary hidden at >800px (checked in Chromium, Firefox and WebKit); no script (2026-10-15)
- [x] The CLI help block in cli.md is readable at 390px with no clipped descriptions — evidence: cli.md: the help block is now a command table and an option table; Playwright 390px: 0 clipped table cells on /docs/cli/ (2026-10-15)
- [x] The Astro cache-headers table in astro.md is readable at 390px without inline code in narrow cells — evidence: astro.md: the cache-headers table is a list with one code block per host; no table on the page (2026-10-15)
- [x] No page scrolls horizontally at 390px — evidence: Playwright 390px: documentElement.scrollWidth = 390 on all 10 pages (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check → 8 docs, 10 pages, passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Tap check: summary click moves the h1 from 171 to 498px. Scratch tooling: a Playwright script serving dist (spike Playwright install).
- [2026-10-15] Completed