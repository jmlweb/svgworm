---
id: LRN-072
title: img width/height attributes parse 1em as 1px; size img icons with CSS
status: active
tags: [adapters, react, templates, img, sizing]
task: TSK-113
created: 2026-11-27
---

On `<svg>`, `width`/`height` are CSS lengths, so `width="1em"` works. On `<img>` they are HTML dimension attributes: the parser reads the leading digits and stops at `e`, so `width="1em"` is 1 px (Chromium and Firefox both render 1x1). Any length with a unit must go into `style` on an `<img>`. The consequence: an inline size beats a class rule, so a CSS class no longer resizes img icons (same as mask icons). Also: `pnpm test` and the conformance suites stay green when every adapter has the same bug, because conformance compares adapters with each other, not with a browser.
