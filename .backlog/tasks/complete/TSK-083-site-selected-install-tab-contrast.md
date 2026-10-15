---
id: TSK-083
title: Site: selected install tab contrast below 4.5:1
status: complete
priority: P2
tags: [site, a11y, contrast]
created: 2026-10-15
source: TSK-080 F2, F4
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site: selected install tab contrast below 4.5:1

## Description

axe color-contrast (serious): .install-tabs label:has(input:checked) is #de8f8a on #704940 = 3.09:1 in dark mode, 4.48:1 in light (#933a43 on #e7c6b4). Hero tab samples 3.2-3.4 in dark. Also recheck 'Get started' and the hero squiggle by hand in dark mode (axe incomplete on the gradient).

## Acceptance Criteria

- [x] Selected tab text is at least 4.5:1 in light and dark, hero and CTA
- [x] axe reports no color-contrast violation on / in either scheme

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-083. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: selected tab text var(--ink) on the soft fill: light CTA 9.54, light hero 8.78, dark CTA 5.68, dark hero worst 4.86 (was 4.48 / 3.09). axe 4.10.2: no color-contrast on / in either scheme. Hand checks: Get started 6.12 dark / 6.23 light; hero squiggle 4.08 dark / 4.71 light (large text, 3:1).
- [2026-10-15] Completed