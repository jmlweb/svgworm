---
id: TSK-086
title: Site: nav and footer link targets at least 24px
status: complete
priority: P4
tags: [site, a11y, mobile]
created: 2026-10-15
source: TSK-080 F6
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site: nav and footer link targets at least 24px

## Description

At 360px footer links are 18-22px high and the Docs/Compare nav links 22px; WCAG 2.2 SC 2.5.8 applies to standalone links. Add vertical padding to .site-footer a and nav a.

## Acceptance Criteria

- [x] Every nav and footer link box is at least 24x24 CSS px at 360px
- [x] No layout change at 1280px beyond the padding

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-086. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: nav links inline-flex min 24x24, footer links inline-block min 24px + 1px padding; at 360px no visible nav/footer link under 24x24; at 1280px only the footer grows ~2px per row.
- [2026-10-15] Completed