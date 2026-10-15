---
id: TSK-087
title: Site: skip link moves focus to main
status: complete
priority: P4
tags: [site, a11y, keyboard]
created: 2026-10-15
source: TSK-080 F7
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site: skip link moves focus to main

## Description

The skip link targets main#content, which has no tabindex, so focus stays on body after Enter in Chrome. Add tabindex=-1 to #content (and no focus outline on it).

## Acceptance Criteria

- [x] After activating the skip link, document.activeElement is main#content in Chromium, Firefox and WebKit

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-087. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: tabindex=-1 on main#content (landing, /docs/, docs pages), #content:focus{outline:none}; activeElement is main#content after the skip link in Chromium, Firefox, WebKit.
- [2026-10-15] Completed