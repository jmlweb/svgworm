---
id: LRN-007
title: resvg-js returns premultiplied pixels and can abort
status: active
tags: [testing, rendering, resvg]
task: TSK-003
created: 2026-10-07
---

@resvg/resvg-js 2.6.2 render().pixels are premultiplied RGBA: divide by alpha before comparing colors. It also aborts the whole Node process (Rust panic in geom.rs, uncatchable) on 49 noto emoji. Render untrusted corpora in a child process or keep a skip list (spikes/TSK-003-color-classification/resvg-panics.txt).