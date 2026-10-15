---
id: TSK-084
title: Site: scrollable code, terminal and table regions keyboard-focusable
status: pending
priority: P3
tags: [site, a11y, keyboard]
created: 2026-10-15
source: TSK-080 F3
depends-on: []
---

# Site: scrollable code, terminal and table regions keyboard-focusable

## Description

axe scrollable-region-focusable (serious): on / at 360px .hero-copy install code, .tile-wide > .code, li:nth-child(3) > .code, .terminal-small > pre; at 1280px figure[aria-label='svgworm build output'] > pre; docs tables at 360px (nextjs, config, troubleshooting, how-it-works, icon). Add tabindex=0 with role=region and an aria-label, and wrap docs tables in a focusable overflow-x:auto container.

## Acceptance Criteria

- [ ] axe reports no scrollable-region-focusable on / and every docs page at 360px and 1280px
- [ ] Docs tables scroll in their own focusable wrapper

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created