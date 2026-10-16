---
id: LRN-049
title: Worker threads cost ~100 ms each to boot svgo; not worth it under ~2k icons
status: active
tags: [perf, core, svgo, spike]
task: TSK-097
created: 2026-10-16
---

## Context
TSK-097 tested a node:worker_threads pool for icon transforms, on top of the fused one-svgo-run transform (TSK-096).

## Insight
Each worker re-imports svgo and the core: about 100 ms of boot, paid in parallel, so 1 or 4 workers cost the same fixed ~100 ms. With the fused transform at ~0.15 ms per icon, break-even sits between 1,500 and 2,000 icons on 14 cores, and only 5,000+ icon sets gain meaningfully (37%). Speeding up the serial path first (fusion) moved the break-even past every realistic user set. Benchmarks of a parallel design go stale once the serial path is optimized.

## Application
Before proposing parallelism in svgworm, measure the worker boot cost against the serial per-icon cost on the current transform. If a pool ever returns (ADR-0031), it goes in build() and fills the TransformCache so compile stays pure and sync; a CLI-only pool breaks "everything the CLI does is possible programmatically".
