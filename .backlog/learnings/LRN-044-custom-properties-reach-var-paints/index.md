---
id: LRN-044
title: Custom properties reach var() paints inside an external use sprite
status: active
tags: [color, css-variables, browsers, delivery]
task: TSK-026
created: 2026-10-15
---

## Context
TSK-026 weighed a generated `--icon-color-N` mode for multicolor theming.
## Insight
CSS custom properties inherit into the `<use>` shadow tree even when the symbol lives in an external sprite file: Chromium, Firefox and WebKit all render `fill="var(--x, fallback)"` with the page's value, from the `<svg>` or any ancestor. Stack icons (`<img>`) are isolated documents and only ever show the fallback.
## Application
Point theming questions to author-written `var()` paints, not a generated mode. Anything that needs page CSS to reach the icon must stay in `delivery: use`.
