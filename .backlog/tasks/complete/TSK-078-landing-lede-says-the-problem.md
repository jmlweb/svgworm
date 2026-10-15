---
id: TSK-078
title: Landing: lede says the problem first, visible stats caption
status: complete
priority: P2
tags: [site, landing, copy]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Landing: lede says the problem first, visible stats caption

## Description

The landing-page design critique (2026-10-15) notes that the hero lede explains the mechanism ("digs through your folder… content-hashed sprite") before the problem.

Rewrite the lede to name the problem first (icon libraries ship runtime and bundle weight), then present svgworm as the fix. Keep the h1 "One sprite. Zero client JS."

The stats band is labeled only by `aria-label="This page in numbers"`, so sighted visitors cannot tell the figures come from this page. Add a visible caption.

## Acceptance Criteria

- [x] The lede names the problem before the mechanism and says the zero JS is for icons
- [x] The h1 is unchanged
- [x] The stats band has a visible caption stating the numbers are from this page's build
- [x] llms.txt and the README get started are checked and changed only if their wording drifts
- [x] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to the wave-2 sonnet worktree agent (site tasks in sequence).
- [2026-10-15] Done by the wave-2 site agent (branch site-wave2, cherry-picked to main); evidence in the agent report summarized here: see commit for TSK-078. site:check and verify exit 0 after merge.
- [2026-10-15] Evidence: lede now 'Icon libraries ship a runtime and every icon as JavaScript, so icons add to your bundle. svgworm digs through your folder of SVG files and leaves one type-safe, content-hashed sprite behind. Render it in Next.js Server Components or Astro with zero client JS for icons.' h1 unchanged; visible stats caption. llms.txt and README get started checked: no drift, left unchanged.
- [2026-10-15] Completed