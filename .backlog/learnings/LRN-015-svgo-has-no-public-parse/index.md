---
id: LRN-015
title: svgo has no public parse function
status: active
tags: [svgo, parser]
task: TSK-009
created: 2026-10-07
---

## Context
The color classifier needs the full SVG tree.
## Insight
svgo 4 only exposes `optimize`. The tree comes from a capture plugin (`fn: root => {...}`), as in the TSK-003 spike.
## Application
Wrap it in a single core helper; gate svgo major upgrades on the full contract snapshot suite.
