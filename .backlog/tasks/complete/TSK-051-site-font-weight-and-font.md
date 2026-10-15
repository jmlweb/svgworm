---
id: TSK-051
title: Site font weight and font caching
status: complete
priority: P3
tags: [site, performance]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site font weight and font caching

## Description

From the 2026-10-15 site review. Fonts are about 147 KB of about 200 KB on the homepage. Bricolage alone is 75 KB, more than 7x the 10 KB sprite, on a page whose pitch is "tiny". JetBrains Mono (40 KB) renders above the fold in the install line and the terminal but is not preloaded. `public/_headers` serves `/fonts/*` as `immutable` for a year, but the file names are not hashed, so a font update would stay stale for returning visitors. Related to TSK-039 (sprite preload), but independent of it.

## Acceptance Criteria

- [x] Bricolage Grotesque is subset or pinned to a static instance and weighs at most 25 KB — evidence: bricolage-grotesque.174b8e47.woff2 = 18,700 B (2026-10-15)
- [x] JetBrains Mono is subset and preloaded, with no visible swap above the fold — evidence: jetbrains-mono.e1ccbad5.woff2 subset + <link rel=preload> in Base.astro (2026-10-15)
- [x] Font file names are content-hashed, or the immutable cache rule no longer applies to unhashed names — evidence: hashed names; site:check verifies hash/reference (2026-10-15)
- [x] Total homepage transfer is measured before and after and recorded in the task — evidence: before ~218.5 KB raw, after 147,724 B raw / 95,937 B gzip (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to a sonnet worktree agent (Phase 2 wave 1).
- [2026-10-15] Fonts subset with fontTools 4.67.0 (throwaway venv): Bricolage 76,888 → 18,700 B (wght pinned 800, opsz 72-96, Latin + used punctuation), JetBrains Mono 40,404 → 27,684 B (wght 400-700, Latin-1 + punctuation), Instrument Sans renamed only. Content-hashed names (<family>.<8 hex>.woff2), JetBrains Mono preloaded (crossorigin), check-output.mjs enforces hash/reference/immutable. Homepage transfer ~218.5 KB raw / ~167 KB gzip before → 147,724 B raw / 95,937 B gzip after. Design deviation: docs .prose h2 700 → 800 (keeping 700 cost ~28 KB). apps/site/LICENSES.md documents the modifications.
- [2026-10-15] Completed