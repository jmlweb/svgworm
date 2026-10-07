---
id: TSK-007
title: Competitor deep-dive and final positioning
status: active
priority: P2
tags: [product, research]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-07
---

# Competitor deep-dive and final positioning

## Description

Resolve Q-50. Verify current versions/features of SVGR, svg-sprite, svgstore, unplugin-icons (other rows verified 2026-10-08). Test @neodx/svg hands-on: closest competitor (multi-sprite, hashed files, typed metadata, CLI + unplugin). Decide build vs contribute. Update differentiators in vision.md.

## Acceptance Criteria

- [ ] viability.md table verified with versions + links
- [ ] vision.md differentiators confirmed or trimmed
- [ ] Go/no-go criteria reviewed
- [ ] @neodx/svg tested on fixture corpus: multicolor/stroke handling, determinism (shuffled input), RSC-safe component, runtime import needed, Turbopack
- [ ] Build-vs-contribute decision for @neodx/svg recorded

## Notes

## Learnings

- LRN-008: neodx defaults break colors and Turbopack setup
## Progress Log

- [2026-10-07] Created
- [2026-10-08] Added @neodx/svg, vite-plugin-svg-spritemap, react-icons-svg-sprite, react-svg-sprite-generator, vite-plugin-svgs-icons to viability.md with versions + links. Doc review of @neodx/svg in viability.md; hands-on test pending
- [2026-10-07] Started
- [2026-10-08] Spike spikes/TSK-007-neodx-next: neodx in Next 16.4 + Turbopack. Webpack plugin path fails; Node API prebuild works; RSC + zero client JS OK; no runtime import. Default output wrong for multicolor (flattened), gradient/mask (blank in SSR), masks (#fff→currentColor), mono fill (black). NFD names change ids/hashes. See RESULTS.md. Not tested: dev watch, Linux/Windows, other browsers
- [2026-10-07] LRN-008 added for neodx findings
