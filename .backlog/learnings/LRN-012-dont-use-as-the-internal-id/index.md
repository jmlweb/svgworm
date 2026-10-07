---
id: LRN-012
title: Don't use . as the internal-id delimiter in sprites
status: active
tags: [svgo, sprite, ids]
task: TSK-006
created: 2026-10-07
---

## Context
Per-icon prefix for internal ids (gradients, masks, clipPath); see LRN-001.
## Insight
In CSS `#a.b` is id plus class; in SMIL `begin="a.b.end"` reads as a syncbase. `<symbolId>_<n>` (trailing `_` never closed) can't collide with a `_hex_`-encoded symbol id.
## Application
Configure the TSK-011 optimizer (`prefixIds`/`cleanupIds`) to emit `<symbolId>_<n>`.
