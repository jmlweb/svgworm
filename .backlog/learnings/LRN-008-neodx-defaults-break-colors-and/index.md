---
id: LRN-008
title: neodx defaults break colors and Turbopack setup
status: active
tags: [competitor, neodx, nextjs]
task: TSK-007
created: 2026-10-07
---

@neodx/svg 1.1.1 in Next 16.4: the documented webpack plugin fails under default Turbopack; only a Node API prebuild works. Default resetColors flattens multicolor icons, inject assets render blank in SSR (mountSvgSprite no-ops without window but marks asset done), mask #fff becomes currentColor, NFD file names change ids. RSC + zero client JS is fine. Evidence: spikes/TSK-007-neodx-next/RESULTS.md