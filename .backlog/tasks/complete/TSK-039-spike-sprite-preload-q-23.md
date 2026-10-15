---
id: TSK-039
title: Spike: sprite preload (Q-23)
status: complete
priority: P2
tags: [spike, performance, delivery, adr, browsers]
created: 2026-10-14
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Spike: sprite preload (Q-23)

## Description

### Why

External `<use>` sprites are invisible to the browser's preload scanner. On a cold load the sprite request starts only after layout reaches the first `<svg><use>`, so text paints before icons. Nothing in the docs mentions it, and no `<link rel="preload">` guidance exists. This is the biggest remaining web-performance gap found in the 2026-10-15 perf audit (see Q-23, deferred by ADR-0005 and confirmed deferred by ADR-0010).

A doc line is not enough: `as="image"` preloads can be ignored or double-fetched depending on the engine's request destination for `<use>`, so the answer needs measurement.

### What

Measure in Chromium, Firefox and WebKit with the TSK-002 Playwright method (same-origin HTTP page, JS disabled):

1. When the sprite request starts relative to HTML parse with no hint.
2. Whether `<link rel="preload" as="image" type="image/svg+xml">` (and alternatives: `as="fetch"`, `crossorigin` variants) is used by the `<use>` fetch, ignored, or double-fetched, per engine.
3. The same for the stack file with the `<img>` and CSS `mask` deliveries. ADR-0010 noted 2-3 cold fetches of the stack; measure whether a preload collapses them.

### Output

- ADR (accepted or rejected) deciding whether preload is a docs recommendation, an adapter helper that emits the `<link>` from the manifest URLs (the manifest already carries them), or nothing.
- A learning, and `docs/open-questions.md` Q-23 updated.
- Prototype under `spikes/<task-id>-sprite-preload/`. A prototype is evidence, not product code.

## Acceptance Criteria

- [x] A Playwright prototype under spikes/<task-id>-sprite-preload/ (TSK-002 method: same-origin HTTP page, JS disabled, bundled Chromium, Firefox and WebKit) records when the sprite request starts relative to HTML parse with no hint, for use, img and mask deliveries — evidence: spikes/TSK-039-sprite-preload/src/measure.mjs: same-origin HTTP, JS off, Chromium 145 / Firefox 146 / WebKit 26, fresh browser + persistent profile per load; no-hint start per use/img/mask in RESULTS.md §1 (2026-10-15)
- [x] Per engine, the matrix records whether <link rel="preload" as="image" type="image/svg+xml"> (and as="fetch" and crossorigin variants) is reused by the <use> fetch, ignored, or causes a double download; same for the stack file and the 2-3 cold stack fetches ADR-0010 noted — evidence: results/matrix.md: 7 variants x head/inline x no-store/immutable/immutable-slow, 5 reps, server-side fetch counts with Sec-Fetch-Mode; stack + ADR-0010 cold fetches reconciled in §3 (2026-10-15)
- [x] An ADR (accepted or rejected) decides: preload as a docs recommendation, an adapter helper that emits the <link> from the manifest URLs, or nothing, with the matrix as evidence — evidence: docs/adr/0019-sprite-preload-not-recommended.md (accepted): no helper, no snippet, docs advise against sprite preload (2026-10-15)
- [x] docs/open-questions.md Q-23 is marked resolved with a link to the ADR, and a learning is recorded — evidence: docs/open-questions.md Q-23 marked resolved → ADR-0019; LRN-039 (2026-10-15)
- [x] If a recommendation is accepted, the Next.js and Astro docs, both agent skills and llms.txt carry the same preload snippet — evidence: N/A as a snippet: no recommendation accepted. The do-not-preload warning goes to TSK-040 (criterion added) for docs + both skills (2026-10-15)

## Notes

## Learnings

- LRN-039: Preload can't match a <use> fetch, and Playwright WebKit/Firefox contexts fake cold-cache results
## Progress Log

- [2026-10-14] Created
- [2026-10-15] Started
- [2026-10-15] Built Playwright preload matrix in spikes/TSK-039-sprite-preload (real fixture output: 87 KB sprite, 4 KB stack)
- [2026-10-15] Harness fixes found along the way: Firefox shares its image cache across contexts, and Playwright WebKit has no HTTP cache in an ephemeral context. Now a fresh browser + persistent profile per load
- [2026-10-15] Result: the <use> fetch is Sec-Fetch-Mode same-origin, which no preload can match. With a preload in flight, WebKit downloads the sprite twice; with no-store, every engine does. Only Firefox gains (822 to 16 ms)
- [2026-10-15] ADR-0019 accepted: no preload helper, no snippet, docs warn against preloading the sprite (handed to TSK-040). Q-23 resolved, LRN-039 recorded, architecture diagram artifact updated
- [2026-10-15] Completed