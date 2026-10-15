---
id: TSK-085
title: Site: render-blocking CSS delays mobile LCP
status: complete
priority: P3
tags: [site, performance]
created: 2026-10-15
source: TSK-080 F5
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site: render-blocking CSS delays mobile LCP

## Description

Lighthouse mobile LCP 2.3 s on / (p.lede, 833 ms render delay): HTML > /_astro/Base.*.css (27 KB, est. 420 ms) > font. On docs ~70% of that CSS (18 KB) is unused because global.css is one file. JetBrains Mono preload landed in TSK-051. Options: split global.css per page type (landing vs docs), or inline critical CSS (CSP allows only hashed scripts, styles need 'self' or 'unsafe-inline').

## Acceptance Criteria

- [x] Landing and docs load only their own CSS, or critical CSS is inlined within the CSP
- [x] Lighthouse mobile LCP on / and /docs/nextjs/ measured before and after and recorded

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-085. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: global.css split into base.css + landing.css + docs.css (each page type loads one stylesheet; base inlined by @import at build). Minified 25.7K → landing 17.9K / docs 14.1K; brotli 5868 B → 4530 / 3623 B. 66 full-page screenshots byte-identical. Lighthouse 13.5.0 mobile median of 5 (local brotli server): / LCP 1539 → 1527 ms, /docs/nextjs/ 1538 → 1521 ms; perf 100 before and after. The audit's 2.3 s LCP did not reproduce locally (simulated LCP floors near 1.5 s).
- [2026-10-15] Completed