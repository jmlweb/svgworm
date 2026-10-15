---
id: TSK-050
title: Landing copy: state the pain and surface the comparison
status: complete
priority: P3
tags: [site, copy]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Landing copy: state the pain and surface the comparison

## Description

From the 2026-10-15 site review. The "Why" section opens with features and never states the pain: SVGR-style components ship every icon as JS, svgworm ships one cached file. The comparison page has reproducible numbers and is the best persuasion asset, but it is reachable only through the nav. The CTA subline "Two packages, one init" is React-specific, while Astro needs one package.

## Acceptance Criteria

- [x] The Why section opens with the problem (icon components shipped as JS) before features — evidence: Landing.astro Why section: a lede before the bento names the pain (one component per icon ships every icon as JS and repeats path data) and the fix (one cached file) (2026-10-15)
- [x] At least one reproducible number from the comparison page appears on the landing — evidence: Right colors tile: 31,390 icons, 99.98% agreement with rendering, the TSK-003 number from the comparison page (2026-10-15)
- [x] The landing body links to /docs/comparison/ — evidence: the Why lede links to /docs/comparison/ (2026-10-15)
- [x] The CTA subline is not React-specific — evidence: CTA subline: One init, Next.js or Astro, and your icons ship as one cached file (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Screenshot of the Why section at 1440 reviewed. pnpm site:check passed.
- [2026-10-15] Completed