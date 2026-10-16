# TSK-097: worker_threads pool for large icon sets

Throwaway prototype. It is evidence for [ADR-0031](../../docs/adr/0031-no-worker-thread-pool-for-icon-transforms.md), not product code.

## What it measures

`src/run.mjs` reads the first N `.svg` files of a folder in code-unit order, transforms them with the built core (`packages/svgworm/dist/core/svg/transform.js`, the fused one-svgo-run transform from TSK-096), and prints the wall time from process start until every result is in hand. The main thread always imports the core, because a real build does too.

`src/pool.mjs` splits the inputs round-robin into one chunk per worker, sends each chunk through `workerData`, and puts the results back in input order. With `WITH_MAIN=1` the main thread takes one chunk too and works on it while the workers boot.

`src/bench.sh` takes the median of 5 cold runs per cell.

## Setup

```bash
pnpm build                                     # at the repo root
mkdir corpora && cd corpora
npm pack lucide-static@1.57.0 @tabler/icons@3.49.0 flag-icons@7.6.0
for t in *.tgz; do mkdir "${t%.tgz}" && tar -xzf "$t" -C "${t%.tgz}"; done
cd ..
sh src/bench.sh corpora/lucide-static-1.57.0/package/icons corpora/tabler-icons-3.49.0/package/icons/outline
```

Keep the corpora outside the repo, or delete them after the run.

## Results (2026-10-16)

Apple Silicon Mac, 14 cores, Node 24.13.0, svgo 4.1.0. Median cold wall time in ms (`results/bench-14core.tsv`). The 20, 300 and 1,500 rows are lucide-static; the 5,000 row is @tabler/icons outline.

| Icons | 0 workers | 2 workers | 4 workers | 2 + main | 4 + main |
|---|---|---|---|---|---|
| 20 | 120 | 228 | 239 | 218 | 228 |
| 300 | 168 | 254 | 262 | 250 | 257 |
| 1,500 | 354 | 370 | 341 | 340 | 332 |
| 5,000 | 926 | 717 | 579 | 607 | 560 |

Fixed cost of the pool, measured with 0 icons (5 runs each):

| Workers | Wall time, ms |
|---|---|
| 0 | 98–107 |
| 1 | 197–215 |
| 2 | 201–213 |
| 4 | 215–223 |

Every worker imports svgo and the core again. That costs about 100 ms per worker, and the workers boot in parallel, so the cost barely grows with the worker count.

## Output identity

The results of 0 workers, 4 workers, and 2 workers plus main were serialized with `JSON.stringify` and compared byte for byte (`--dump`):

- lucide-static, 1,500 icons: identical
- @tabler/icons outline, 5,000 icons: identical
- flag-icons 4x3, 300 multicolor icons with gradients, clipPath and ids: identical

Order is stable by construction: results are placed by input index, and `compile` sorts diagnostics anyway.

## Reading

- Compared with the unfused numbers in TSK-097's description (1,539 icons: 463 → 272 ms with 4 workers), fusion (TSK-096) made the single-threaded path fast enough that the pool no longer pays at 1,500 icons. The break-even is between 1,500 and 2,000 icons on this machine.
- The 4-worker gain at 5,000 icons is 37%, about 350 ms, on 14 cores.
- Not measured: 2–4-core CI runners. The ~100 ms boot cost is per thread and does not shrink with fewer cores, while the parallel part does, so the break-even there can only be higher. This Mac cannot stand in for those runners.
- Real projects in the target list (`docs/outreach/target-repos.md`) have 26–56 icons. At that size the pool would add about 100 ms to every cold build.
