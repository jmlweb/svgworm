# 0015. Incremental watch through an in-memory transform cache

- **Status:** accepted
- **Date:** 2026-10-12
- **Task:** TSK-023
- **Resolves:** Q-42 (incremental part); completes R-30

## Context

`svgworm watch` (TSK-013) rebuilt everything on every change: discover, read, optimize and classify each icon, assemble, write. [ADR-0008](0008-tech-stack-and-package-layout.md) asked for the incremental version to key its cache by content hash, resolved config and svgworm version, and R-30 says watch "rebuilds only what changed". The expensive step is the per-icon transform (svgo parse, inline styles, optimize, classify, rename ids): about 0.85 s for 1,000 icons; discovery, reading, assembly and hashing are a few milliseconds.

## Options considered

1. **In-memory cache of transform results, scoped to the watch process.** Chosen. Keyed by a SHA-256 over the file bytes plus the display path, symbol id and color mode (everything `transformIcon` reads). Entries not touched by a build are dropped after it, so the cache size equals the current icon set. No version key is needed: the cache does not outlive the process that built it.
2. **On-disk cache (for example under `node_modules/.cache/svgworm`).** Would also speed up the first `svgworm` of a session and CI runs. It needs a version and config key, invalidation on upgrade, a location that works in sandboxes, and tests for corruption. The cold build is 1 s per 1,000 icons (R-50), so the gain is small and the surface is large. Not now; can be added on top of the same key.
3. **Watch only the changed file and patch the sprite.** The sprite and manifest are whole-file artifacts with content hashes and sorted collections; patching them is more code than rebuilding them from cached transforms, and it reintroduces order dependence.

## Decision

- `compile()` accepts an optional `cache` (`createTransformCache()`). With it, an icon whose key is already present reuses the stored transform result (successes and failures alike) and the `icon` event carries `fromCache: true`. After each compile the cache drops entries the compile did not touch.
- `build()` and `compileFromDisk()` forward the cache; `watch()` creates one and uses it for every rebuild. `build`, `check` and the CLI `build` command never cache, so a one-off build is always a full build and output bytes never depend on a cache.
- The plain reporter appends `(cached)` to the `icon` line when a transform was reused. No stats field changes (the contract and the `--json` document are unchanged).

## Evidence

- Benchmark, 2026-10-12, Apple M4 Max, Node 24.13, 1,000 icons cycled from `fixtures/` (the R-50 set): cold compile 846 ms (3 runs: 849, 843, 846); with a warm cache 10 ms (12, 10, 10); with one icon changed 10 ms. Script in the TSK-023 progress log.
- `cache.test.ts`: byte-identical output with and without the cache; a changed file is re-transformed and others are reused; a renamed file or a changed color mode misses; failures are cached; entries of removed files are swept. `watch.test.ts`: a rebuild after editing one of two icons reports `home` fresh and `other` from the cache.

## Consequences

- R-30 is met in full; `docs/requirements.md` and `docs/open-questions.md` are updated. `svgworm watch` after a change costs milliseconds plus the write, which is what `next dev` needs.
- Memory: one transform result per icon (the optimized markup) for the lifetime of the watch. For 20,000 icons that is in the low tens of megabytes.
- An on-disk cache, if ever wanted, must extend the key with the svgworm version and the resolved config, as ADR-0008 said. The in-memory key is deliberately smaller because the process is the version.
