---
id: TSK-071
title: Docs: on-this-page right rail with scroll-spy
status: complete
priority: P4
tags: [site, docs, design]
created: 2026-10-15
source: manual
depends-on: [TSK-068]
started: 2026-10-15
completed: 2026-10-15
---

# Docs: on-this-page right rail with scroll-spy

## Description

From the 2026-10-15 docs design critique. At 1440px about 250px right of the content column is unused, while the current page's sections are nested under it in the left sidebar, making it long. Move the sections to a right rail and highlight the section in view. Depends on the mobile nav task because both change `DocsNav.astro`.

## Acceptance Criteria

- [x] At >=1200px the section list sits in a right rail and the left nav lists pages only — evidence: Playwright 1440px: .docs-rail visible with the 6 section links, the left nav TOC hidden, grid 220px / content / 200px (2026-10-15)
- [x] The current section is highlighted while scrolling (JS on docs pages only) — evidence: docs page script marks the last heading above the top third with aria-current=location; after scrolling to #init the rail link #init is current; no page errors (2026-10-15)
- [x] Without JS the rail is a plain list of links — evidence: Playwright with JavaScript disabled at 1440px: the rail shows the 6 links, none current (2026-10-15)
- [x] Below 1200px the layout stays as it is now — evidence: Playwright 1100px: rail hidden, the TOC nested in the left nav visible, grid 220px / content as before (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Also: scroll-margin-top on h2/h3 so anchor jumps land below the sticky header, and inline code in docs does not split at hyphens from 640px. pnpm site:check and astro check pass; all 10 pages still 390px wide at 390.
- [2026-10-15] Completed