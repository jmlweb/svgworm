---
id: LRN-006
title: Recolor masks only after freezing inherited fill
status: active
tags: [color, svg, mask]
task: TSK-003
created: 2026-10-07
---

Mask content inherits paint from where the mask is declared, not from the element it masks. Setting root fill=currentColor (or rewriting mask colors) changes mask luminance, so the shape changes with the text color. neodx does this (TSK-007). Fix: never rewrite inside mask/clipPath, and make the mask's inherited fill explicit before touching the root. Verified by render: coverage stays identical (2,029,875 vs 437,829 for the neodx-style rewrite).