---
id: TSK-051
title: Site font weight and font caching
status: pending
priority: P3
tags: [site, performance]
created: 2026-10-15
source: manual
depends-on: []
---

# Site font weight and font caching

## Description

From the 2026-10-15 site review. Fonts are about 147 KB of about 200 KB on the homepage. Bricolage alone is 75 KB, more than 7x the 10 KB sprite, on a page whose pitch is "tiny". JetBrains Mono (40 KB) renders above the fold in the install line and the terminal but is not preloaded. `public/_headers` serves `/fonts/*` as `immutable` for a year, but the file names are not hashed, so a font update would stay stale for returning visitors. Related to TSK-039 (sprite preload), but independent of it.

## Acceptance Criteria

- [ ] Bricolage Grotesque is subset or pinned to a static instance and weighs at most 25 KB
- [ ] JetBrains Mono is subset and preloaded, with no visible swap above the fold
- [ ] Font file names are content-hashed, or the immutable cache rule no longer applies to unhashed names
- [ ] Total homepage transfer is measured before and after and recorded in the task

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created