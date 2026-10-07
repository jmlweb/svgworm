---
id: TSK-007
title: Competitor deep-dive and final positioning
status: complete
priority: P2
tags: [product, research]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-07
completed: 2026-10-07
---

# Competitor deep-dive and final positioning

## Description

Resolve Q-50. Verify current versions/features of SVGR, svg-sprite, svgstore, unplugin-icons (other rows verified 2026-10-08). Test @neodx/svg hands-on: closest competitor (multi-sprite, hashed files, typed metadata, CLI + unplugin). Decide build vs contribute. Update differentiators in vision.md.

## Acceptance Criteria

- [x] viability.md table verified with versions + links
- [x] vision.md differentiators confirmed or trimmed
- [x] Go/no-go criteria reviewed
- [x] @neodx/svg tested on fixture corpus: multicolor/stroke handling, determinism (shuffled input), RSC-safe component, runtime import needed, Turbopack
- [x] Build-vs-contribute decision for @neodx/svg recorded

## Notes

## Learnings

- LRN-008: neodx defaults break colors and Turbopack setup
## Progress Log

- [2026-10-07] Created
- [2026-10-08] Added @neodx/svg, vite-plugin-svg-spritemap, react-icons-svg-sprite, react-svg-sprite-generator, vite-plugin-svgs-icons to viability.md with versions + links. Doc review of @neodx/svg in viability.md; hands-on test pending
- [2026-10-07] Started
- [2026-10-08] Spike spikes/TSK-007-neodx-next: neodx in Next 16.4 + Turbopack. Webpack plugin path fails; Node API prebuild works; RSC + zero client JS OK; no runtime import. Default output wrong for multicolor (flattened), gradient/mask (blank in SSR), masks (#fff→currentColor), mono fill (black). NFD names change ids/hashes. See RESULTS.md. Not tested: dev watch, Linux/Windows, other browsers
- [2026-10-07] LRN-008 added for neodx findings
- [2026-10-07] Remaining rows verified (SVGR 8.1.0, svg-sprite 2.0.4, svgstore 3.0.1, unplugin-icons 24.0.0, with downloads). Build-vs-contribute: build, ADR-0005 accepted by user, with kill criteria at 12 weeks after v0.1.0. vision.md positioning and differentiators rewritten; go/no-go reviewed (color met, TS perf deferred). All criteria met
- [2026-10-07] Completed
