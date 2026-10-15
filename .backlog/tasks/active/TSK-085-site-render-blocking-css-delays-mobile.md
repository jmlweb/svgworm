---
id: TSK-085
title: Site: render-blocking CSS delays mobile LCP
status: active
priority: P3
tags: [site, performance]
created: 2026-10-15
source: TSK-080 F5
depends-on: []
started: 2026-10-15
---

# Site: render-blocking CSS delays mobile LCP

## Description

Lighthouse mobile LCP 2.3 s on / (p.lede, 833 ms render delay): HTML > /_astro/Base.*.css (27 KB, est. 420 ms) > font. On docs ~70% of that CSS (18 KB) is unused because global.css is one file. JetBrains Mono preload landed in TSK-051. Options: split global.css per page type (landing vs docs), or inline critical CSS (CSP allows only hashed scripts, styles need 'self' or 'unsafe-inline').

## Acceptance Criteria

- [ ] Landing and docs load only their own CSS, or critical CSS is inlined within the CSP
- [ ] Lighthouse mobile LCP on / and /docs/nextjs/ measured before and after and recorded

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).