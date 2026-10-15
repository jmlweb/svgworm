---
id: TSK-083
title: Site: selected install tab contrast below 4.5:1
status: active
priority: P2
tags: [site, a11y, contrast]
created: 2026-10-15
source: TSK-080 F2, F4
depends-on: []
started: 2026-10-15
---

# Site: selected install tab contrast below 4.5:1

## Description

axe color-contrast (serious): .install-tabs label:has(input:checked) is #de8f8a on #704940 = 3.09:1 in dark mode, 4.48:1 in light (#933a43 on #e7c6b4). Hero tab samples 3.2-3.4 in dark. Also recheck 'Get started' and the hero squiggle by hand in dark mode (axe incomplete on the gradient).

## Acceptance Criteria

- [ ] Selected tab text is at least 4.5:1 in light and dark, hero and CTA
- [ ] axe reports no color-contrast violation on / in either scheme

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).