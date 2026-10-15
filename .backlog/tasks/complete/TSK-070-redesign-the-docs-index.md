---
id: TSK-070
title: Redesign the docs index
status: complete
priority: P3
tags: [site, docs, design]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Redesign the docs index

## Description

From the 2026-10-15 docs design critique. `/docs/` shows five equal-weight cards, Comparison sits alone on the last row, and the sidebar repeats the cards. New users get no starting point: lead with the quickstart, then the two framework guides, then reference.

## Acceptance Criteria

- [x] A quickstart command (pnpm add -D svgworm && pnpm svgworm init) sits at the top of /docs/ — evidence: docs/index.astro: quickstart line pnpm add -D svgworm && pnpm svgworm init (plus the npm form) right under the lede (2026-10-15)
- [x] Next.js and Astro setup are the primary cards — evidence: Set up group: Next.js and Astro cards in a two-column grid (2026-10-15)
- [x] CLI and Config form a reference row and Comparison is a single line, with no orphan card — evidence: Reference group is a list of rows (Icon, CLI, Config, Troubleshooting, How it works), no cards, so no orphan at any width; Comparison is one sentence with a link (2026-10-15)
- [x] At 1440 and 390 the first viewport shows the quickstart and both framework entries — evidence: Playwright Chromium 390x844 screenshot: h1, quickstart and both setup cards in the first viewport; 1440x900 screenshot: quickstart, both cards and the reference rows visible (2026-10-15)
- [x] The setup steps get stronger numbered styling — evidence: .prose > ol top-level steps get circled counters (screenshot of /docs/nextjs/ at 1440); pnpm site:check passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] The index throws at build time when a new doc is not assigned to a group, so the page cannot silently drop a doc.
- [2026-10-15] Completed