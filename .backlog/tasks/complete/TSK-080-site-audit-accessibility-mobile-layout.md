---
id: TSK-080
title: Site audit: accessibility, mobile layout, Core Web Vitals
status: complete
priority: P3
tags: [site, accessibility, performance]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site audit: accessibility, mobile layout, Core Web Vitals

## Description

Section 7 of the landing-page design critique (2026-10-15) is a checklist with no findings yet. Turn it into facts.

Run axe and Lighthouse on `/` and on a docs page, and check both at 360px and 768px. Cover keyboard and focus, contrast, heading structure, and terminal and code overflow. File each finding as its own task or report.

TSK-051 (font weight and caching) overlaps on performance but does not block this.

## Acceptance Criteria

- [x] axe and Lighthouse (mobile and desktop) results for / and /docs/nextjs/ are recorded in the progress log — evidence: Lighthouse 13.5.0 + axe-core 4.14.0 results logged (2026-10-15)
- [x] Keyboard-only navigation of the header, install switch, copy buttons and color demo is checked — evidence: keyboard checks logged (Playwright) (2026-10-15)
- [x] Overflow of the terminal and code blocks at 360px is checked — evidence: overflow at 360/768 logged (2026-10-15)
- [x] Each finding is filed with /flowstate:report or /flowstate:add-task — evidence: findings filed as TSK-082..TSK-087 (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to a sonnet worktree agent (audit only, findings returned to the main session).
- [2026-10-15] Audit run by a sonnet worktree agent, one-off tools outside the repo (Lighthouse 13.5.0 on Chrome 155, axe-core 4.14.0 via playwright-core 1.60.0; local static server applying the /* _headers CSP, no compression, so cache/latency insights are artifacts). Fonts measured before TSK-051 landed.
- [2026-10-15] Lighthouse mobile/desktop: / perf 98/100, a11y 96/96, best-practices 100/100, SEO 100/100; /docs/nextjs/ perf 99/100, a11y 100/100, BP 100/100, SEO 100/100. CLS 0, TBT 0 ms. LCP / mobile 2.3 s (p.lede), desktop 0.5 s.
- [2026-10-15] axe: / 1280: color-contrast 1 + scrollable-region-focusable 1; 768: color-contrast 1; 360: color-contrast 1 + scrollable-region-focusable 4 nodes. /docs/nextjs/: 0 at 1280 and 768, scrollable-region-focusable (table) at 360.
- [2026-10-15] Keyboard: header order skip link, logo, Docs, Compare, npm, GitHub with visible 2px focus in both schemes; install switch radios (one tab stop, arrows switch); color demo radios; animation toggle (Space/Enter, aria-pressed). There are no copy buttons (click-to-select install line by design), so that item is n/a.
- [2026-10-15] Overflow: none at 768; at 360 code/terminal scroll in their own boxes, but / and /docs/ scroll horizontally (F1). Headings: one h1, no skipped levels on 10 pages.
- [2026-10-15] Findings filed: F1 TSK-082 (360px page scroll, high), F2+F4 TSK-083 (selected tab contrast 3.09:1), F3 TSK-084 (scrollable regions not focusable), F5 TSK-085 (render-blocking CSS / LCP), F6 TSK-086 (target size), F7 TSK-087 (skip link focus).
- [2026-10-15] Completed