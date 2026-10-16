# 0031. No worker-thread pool for icon transforms

- **Status:** rejected
- **Date:** 2026-10-16
- **Task:** TSK-097
- **Resolves:** Q-43

## Context

The per-icon transform is pure and independent, and on big icon sets it dominates a cold build. After TSK-096 fused the five svgo runs per icon into one, the only large lever left is parallelism. `node:worker_threads` needs no new dependency (ADR-0008). Before TSK-096, a prototype on a 14-core Mac took lucide-static (1,539 icons) from 463 ms to 272 ms with 4 workers.

The questions were: whether to add a pool at all, the size threshold, where the pool lives (core or CLI), and how it works with the watch transform cache (ADR-0015).

## Options considered

1. **A pool in `build()` (core, file-system side)**, used above a size threshold. Workers transform the icons and fill a `TransformCache`, then the pure, synchronous `compile` reads every result as a cache hit. `compile` stays pure, and programmatic users get the speed-up through `build()`. Costs: the naming and color-mode logic that builds each `TransformInput` has to move out of `compile` so `build()` can plan the inputs; `icon` progress events stall while the pool runs and then arrive all at once; pool results would be reported as `fromCache` unless the cache learns where an entry came from; and the core starts managing threads.
2. **A pool in the CLI.** This breaks the architecture rule "Everything the CLI does should also be possible programmatically": a `build()` caller would get a slower build than the CLI for the same input.
3. **No pool.** The single-threaded path stays the only one.

## Decision

Option 3: no worker-thread pool. Revisit only if a user reports slow cold builds on a set of several thousand icons, or if a worker's boot cost drops a lot (for example, if svgo's import gets much cheaper). If it comes back, use option 1. Option 2 is ruled out by the architecture rule above.

## Evidence

The prototype is in [`spikes/TSK-097-worker-pool/`](../../spikes/TSK-097-worker-pool/RESULTS.md), measured on top of the fused transform. Median cold wall time on a 14-core Mac, Node 24.13.0:

| Icons | 0 workers | 2 workers | 4 workers |
|---|---|---|---|
| 20 | 120 ms | 228 ms | 239 ms |
| 300 | 168 ms | 254 ms | 262 ms |
| 1,500 | 354 ms | 370 ms | 341 ms |
| 5,000 | 926 ms | 717 ms | 579 ms |

- **Each worker costs about 100 ms to boot**, because it imports svgo and the core again. With 0 icons, 1 to 4 workers take 197–223 ms against 98–107 ms for none.
- **Break-even is between 1,500 and 2,000 icons** on 14 cores. Below that, the pool makes builds slower.
- **The gain at 5,000 icons is 37%** (about 350 ms) with 4 workers.
- **2–4-core CI runners were not measured.** This Mac cannot stand in for them. The boot cost does not shrink with fewer cores, while the parallel part does, so the break-even there can only be higher.
- **The output is byte-identical** with 0, 4, and 2 workers plus main on lucide (1,500), @tabler/icons outline (5,000) and flag-icons (300 multicolor icons). The order is stable by construction.
- **Target users have small sets.** The repos in `docs/outreach/target-repos.md` have 26–56 icon SVGs, where a pool would add about 100 ms to every cold build.
- **Watch rebuilds already skip unchanged icons** through the transform cache (ADR-0015: about 10 ms for one change among 1,000 icons). Only cold builds and the first watch build would gain.

## Consequences

- The core stays single-threaded and free of thread management, and `compile` keeps its synchronous, pure signature.
- Very large sets (5,000 or more icons) keep a cold build of about 0.9 s for the transform step on a fast machine. That is accepted until a user reports it.
- No follow-up task. TSK-097's spike is the reference if this question comes back.
