---
id: LRN-005
title: Transparent gradient stops still tint color
status: active
tags: [color, svg, gradient]
task: TSK-003
created: 2026-10-07
---

A gradient stop with stop-opacity=0 still affects interpolated colors (SVG gradients interpolate unpremultiplied), so fading to transparent white renders lighter tints. When collecting an icon's colors, count every stop unless all stops are transparent. Skipping them made logos/scaledrone look mono, the only dangerous misclassification found in 31k icons. Evidence: spikes/TSK-003-color-classification/RESULTS.md