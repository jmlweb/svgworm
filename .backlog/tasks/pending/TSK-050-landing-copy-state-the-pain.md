---
id: TSK-050
title: Landing copy: state the pain and surface the comparison
status: pending
priority: P3
tags: [site, copy]
created: 2026-10-15
source: manual
depends-on: []
---

# Landing copy: state the pain and surface the comparison

## Description

From the 2026-10-15 site review. The "Why" section opens with features and never states the pain: SVGR-style components ship every icon as JS, svgworm ships one cached file. The comparison page has reproducible numbers and is the best persuasion asset, but it is reachable only through the nav. The CTA subline "Two packages, one init" is React-specific, while Astro needs one package.

## Acceptance Criteria

- [ ] The Why section opens with the problem (icon components shipped as JS) before features
- [ ] At least one reproducible number from the comparison page appears on the landing
- [ ] The landing body links to /docs/comparison/
- [ ] The CTA subline is not React-specific

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created