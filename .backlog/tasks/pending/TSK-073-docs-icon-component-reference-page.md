---
id: TSK-073
title: Docs: Icon component reference page
status: pending
priority: P2
tags: [docs, react, astro, a11y]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: Icon component reference page

## Description

From the 2026-10-15 docs copy review. No docs page says what Icon accepts or what it renders. The markup depends on the icon's delivery (packages/react/src/create-icon.tsx): `<svg><use>` for plain icons, `<img>` for multicolor stack icons, a `<span>` with a CSS mask for mono stack icons. CSS that targets `svg` silently misses the last two. title or label sets role=img; otherwise the icon is aria-hidden. Cover React and Icon.astro on one page, since they must render the same markup (ADR-0017).

## Acceptance Criteria

- [ ] A /docs/icon/ page documents the React Icon and Icon.astro props: name, title vs label, width/height (default 1em), className/class, style and other SVG props
- [ ] It shows the markup per delivery form (<svg><use>, <img>, <span> with a CSS mask) and which CSS selectors reach each
- [ ] It explains sizing and coloring with CSS (color on the parent for mono icons)
- [ ] Both setup guides link to it in their Next lists; llms.txt and both skills point to it
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created