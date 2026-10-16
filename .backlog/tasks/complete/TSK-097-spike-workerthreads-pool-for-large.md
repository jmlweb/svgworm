---
id: TSK-097
title: Spike: worker_threads pool for large icon sets
status: complete
priority: P4
tags: [perf, spike, adr, core]
created: 2026-10-16
source: manual
depends-on: [TSK-096]
started: 2026-10-16
completed: 2026-10-16
---

# Spike: worker_threads pool for large icon sets

## Description

### Why

Per-icon transforms are pure and independent. Above a few hundred icons they dominate build time, and the only big lever left after TSK-096 is parallelism. `node:worker_threads` needs no new dependency.

### Prototype numbers (2026-10-16)

Measured on a 14-core Mac with the *unfused* transform, as cold wall time including worker start:

| Icon set | 0 workers | 2 workers | 4 workers | 6 workers |
|---|---|---|---|---|
| 4 icons | 99 ms | 114 ms | 136 ms | 147 ms |
| lucide-static, 1,539 icons | 463 ms | 328 ms | 272 ms | 261 ms |
| @tabler/icons outline, 4,905 icons | 1,195 ms | 790 ms | 600 ms | 521 ms |

Each worker imports svgo again, which costs about 75 ms, so small sets get slower. The prototype splits icons round-robin, sends each worker its chunk through `workerData`, and puts results back in input order.

### Open questions

- Size threshold below which it stays single-threaded.
- Where the pool lives. The core must stay pure and must not write to stdout. Is a pool in the core acceptable, or is it a CLI concern?
- How it interacts with the watch `TransformCache`, which lives in the main thread.
- Deterministic result order. Errors must keep today's order.
- Gains on 2–4 core CI runners.
- Measure on top of TSK-096's fused transform. Don't multiply the gains above with fusion's.

## Acceptance Criteria

- [x] Throwaway prototype in spikes/<id>-worker-pool/ measures cold wall time at 20 / 300 / 1.5k / 5k icons with 0, 2 and 4 workers, on top of the fused transform — evidence: spikes/TSK-097-worker-pool/RESULTS.md: 20/300/1.5k/5k icons × 0/2/4 workers (+main-lane variant), fused transform (2026-10-16) (2026-10-16)
- [x] Size threshold chosen from the data; output proven byte-identical with and without workers — evidence: No threshold needed (pool rejected); break-even 1.5k-2k icons on 14 cores; JSON results byte-identical with 0/4/2+main workers on lucide 1500, tabler 5000, flags 300 (2026-10-16) (2026-10-16)
- [x] ADR (accepted or rejected) decides pool location (core or CLI), threshold and watch-cache interaction — evidence: docs/adr/0031-no-worker-thread-pool-for-icon-transforms.md, status rejected; location (build() filling TransformCache if ever revisited, never CLI-only) and watch-cache interaction recorded (2026-10-16) (2026-10-16)
- [x] Learning added and docs/open-questions.md updated — evidence: LRN-049 added; docs/open-questions.md Q-43 resolved (2026-10-16) (2026-10-16)

## Notes

## Learnings

- LRN-049: Worker threads cost ~100 ms each to boot svgo; not worth it under ~2k icons
## Progress Log

- [2026-10-16] Created
- [2026-10-16] Started
- [2026-10-16] Spike run on the fused transform (after TSK-096). Worker boot is about 100 ms each (svgo re-import), parallel, so the fixed cost is ~100 ms regardless of count. Results 14 cores: 20 icons 120 → 228 ms (2 workers); 300: 168 → 254; 1,500: 354 → 341 (4 workers); 5,000: 926 → 579 (4 workers). A main-thread lane helps by under 20 ms.
- [2026-10-16] ADR-0031 rejects the pool. 2-4 core CI runners not measured; stated in the ADR instead of estimated. Size threshold criterion answered as "no threshold, no pool" with the break-even recorded.
- [2026-10-16] Completed