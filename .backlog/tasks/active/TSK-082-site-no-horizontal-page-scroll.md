---
id: TSK-082
title: Site: no horizontal page scroll at 360px (CTA install switch, docs install line)
status: active
priority: P2
tags: [site, mobile, a11y]
created: 2026-10-15
source: TSK-080 F1
depends-on: []
started: 2026-10-15
---

# Site: no horizontal page scroll at 360px (CTA install switch, docs install line)

## Description

Audit 2026-10-15: at 360px / scrollWidth 370 (378 at 375px) because the CTA .install-switch (grid item, min-width:auto, nowrap code) is 381px in a 328px column; /docs/ scrollWidth 375 because article.prose > p.install is 359px in a 328px article. Fix with min-width:0 on the grid item and a shrinkable p.install whose code scrolls.

## Acceptance Criteria

- [ ] No page has scrollWidth > clientWidth at 360px and 375px (checked with Playwright on /, /docs/ and every docs page)
- [ ] Install commands scroll inside their own box

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).