---
id: TSK-087
title: Site: skip link moves focus to main
status: pending
priority: P4
tags: [site, a11y, keyboard]
created: 2026-10-15
source: TSK-080 F7
depends-on: []
---

# Site: skip link moves focus to main

## Description

The skip link targets main#content, which has no tabindex, so focus stays on body after Enter in Chrome. Add tabindex=-1 to #content (and no focus outline on it).

## Acceptance Criteria

- [ ] After activating the skip link, document.activeElement is main#content in Chromium, Firefox and WebKit

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created