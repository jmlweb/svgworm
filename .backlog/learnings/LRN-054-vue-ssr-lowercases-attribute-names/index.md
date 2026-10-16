---
id: LRN-054
title: Vue SSR lowercases attribute names bound through a v-bind object
status: active
tags: [vue, ssr, svg, conformance]
task: TSK-092
created: 2026-10-16
---

## Context
The generated Icon.vue binds `$attrs` with `v-bind="{ ...a11y, ...attrs }"` on the `<svg>`. The conformance test compared its server HTML with createIcon.

## Insight
Once an element has a `v-bind` object, the Vue compiler merges every attribute through `mergeProps` and `ssrRenderAttrs(props)` without the tag. Without the tag, `ssrRenderDynamicAttr` lowercases names, so `viewBox` is rendered as `viewbox`, even on `<svg>`. The HTML parser restores the SVG case ("adjust SVG attributes"), and client rendering uses `setAttribute` with the right case, so browsers are unaffected.

## Application
Do not try to fix it in the template. Compare markup with a single, documented adjustment (`viewbox` → `viewBox`) in tests/conformance, and keep any new SVG camelCase attribute in mind when reading Vue SSR output.
