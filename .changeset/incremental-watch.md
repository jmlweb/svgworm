---
'svgworm': minor
---

`svgworm watch` is incremental: only icons whose content changed are re-optimized on a rebuild (about 10 ms for 1,000 unchanged icons), through an in-memory per-icon transform cache (ADR-0015). The plain reporter marks reused icons with `(cached)`, and the `icon` event gains `fromCache`. The programmatic API gains `createTransformCache()` and a `cache` option on `compile`, `build` and `compileFromDisk`. One-off builds and `check` never use a cache.
