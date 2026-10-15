---
id: TSK-078
title: Landing: lede says the problem first, visible stats caption
status: active
priority: P2
tags: [site, landing, copy]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
---

# Landing: lede says the problem first, visible stats caption

## Description

The landing-page design critique (2026-10-15) notes that the hero lede explains the mechanism ("digs through your folder… content-hashed sprite") before the problem.

Rewrite the lede to name the problem first (icon libraries ship runtime and bundle weight), then present svgworm as the fix. Keep the h1 "One sprite. Zero client JS."

The stats band is labeled only by `aria-label="This page in numbers"`, so sighted visitors cannot tell the figures come from this page. Add a visible caption.

## Acceptance Criteria

- [ ] The lede names the problem before the mechanism and says the zero JS is for icons
- [ ] The h1 is unchanged
- [ ] The stats band has a visible caption stating the numbers are from this page's build
- [ ] llms.txt and the README get started are checked and changed only if their wording drifts
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).