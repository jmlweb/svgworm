---
id: TSK-070
title: Redesign the docs index
status: pending
priority: P3
tags: [site, docs, design]
created: 2026-10-15
source: manual
depends-on: []
---

# Redesign the docs index

## Description

From the 2026-10-15 docs design critique. `/docs/` shows five equal-weight cards, Comparison sits alone on the last row, and the sidebar repeats the cards. New users get no starting point: lead with the quickstart, then the two framework guides, then reference.

## Acceptance Criteria

- [ ] A quickstart command (pnpm add -D svgworm && pnpm svgworm init) sits at the top of /docs/
- [ ] Next.js and Astro setup are the primary cards
- [ ] CLI and Config form a reference row and Comparison is a single line, with no orphan card
- [ ] At 1440 and 390 the first viewport shows the quickstart and both framework entries
- [ ] The setup steps get stronger numbered styling

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created