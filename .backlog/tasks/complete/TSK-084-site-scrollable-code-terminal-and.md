---
id: TSK-084
title: Site: scrollable code, terminal and table regions keyboard-focusable
status: complete
priority: P3
tags: [site, a11y, keyboard]
created: 2026-10-15
source: TSK-080 F3
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site: scrollable code, terminal and table regions keyboard-focusable

## Description

axe scrollable-region-focusable (serious): on / at 360px .hero-copy install code, .tile-wide > .code, li:nth-child(3) > .code, .terminal-small > pre; at 1280px figure[aria-label='svgworm build output'] > pre; docs tables at 360px (nextjs, config, troubleshooting, how-it-works, icon). Add tabindex=0 with role=region and an aria-label, and wrap docs tables in a focusable overflow-x:auto container.

## Acceptance Criteria

- [x] axe reports no scrollable-region-focusable on / and every docs page at 360px and 1280px
- [x] Docs tables scroll in their own focusable wrapper

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-084. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: landing pre.code, .terminal pre and install code get tabindex=0, role=region, aria-label; docs tables wrapped by [slug].astro in div.table-scroll (role=region, tabindex=0, unique aria-label). axe: no scrollable-region-focusable on / and every docs page at 360/375/1280, light and dark. Remaining axe note: landmark-complementary-is-top-level (moderate) on docs alert <aside> blocks, out of scope.
- [2026-10-15] Completed