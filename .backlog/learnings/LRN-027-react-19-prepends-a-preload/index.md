---
id: LRN-027
title: React 19 prepends a preload link to server-rendered img
status: active
tags: [react, rsc, testing, adapter]
task: TSK-017
created: 2026-10-12
---

## Context
Testing the @svgworm/react Icon with renderToStaticMarkup, the img delivery rendered `<link rel="preload" as="image" ...>` before the `<img>`. React DOM also sorts attributes alphabetically in output.
## Insight
Exact-string assertions on React 19 server markup break on the hoisted preload hint and on attribute order.
## Application
Assert with toContain on the element, written with alphabetical attributes, instead of toBe on the whole string.
