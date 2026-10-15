---
id: TSK-073
title: Docs: Icon component reference page
status: complete
priority: P2
tags: [docs, react, astro, a11y]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: Icon component reference page

## Description

From the 2026-10-15 docs copy review. No docs page says what Icon accepts or what it renders. The markup depends on the icon's delivery (packages/react/src/create-icon.tsx): `<svg><use>` for plain icons, `<img>` for multicolor stack icons, a `<span>` with a CSS mask for mono stack icons. CSS that targets `svg` silently misses the last two. title or label sets role=img; otherwise the icon is aria-hidden. Cover React and Icon.astro on one page, since they must render the same markup (ADR-0017).

## Acceptance Criteria

- [x] A /docs/icon/ page documents the React Icon and Icon.astro props: name, title vs label, width/height (default 1em), className/class, style and other SVG props — evidence: apps/site/src/content/docs/icon.md Props table: name, title vs label, width/height 1em, className/class, style, other SVG props (2026-10-15)
- [x] It shows the markup per delivery form (<svg><use>, <img>, <span> with a CSS mask) and which CSS selectors reach each — evidence: icon.md Markup per delivery: use, img, mask markup and Reaching every delivery with CSS (class, not svg) (2026-10-15)
- [x] It explains sizing and coloring with CSS (color on the parent for mono icons) — evidence: icon.md Sizing and Coloring sections (color on the parent for mono, mask size inline) (2026-10-15)
- [x] Both setup guides link to it in their Next lists; llms.txt and both skills point to it — evidence: nextjs.md and astro.md Next lists link /docs/icon/; llms.txt Docs list; both skills step 4 link it (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check → 8 docs, 10 pages, passed; anchor check over dist: no broken doc anchor (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset. Page order 3 (after the setup guides).
- [2026-10-15] Completed