---
id: TSK-039
title: Spike: sprite preload (Q-23)
status: pending
priority: P2
tags: [spike, performance, delivery, adr, browsers]
created: 2026-10-14
source: manual
depends-on: []
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

- [ ] A Playwright prototype under spikes/<task-id>-sprite-preload/ (TSK-002 method: same-origin HTTP page, JS disabled, bundled Chromium, Firefox and WebKit) records when the sprite request starts relative to HTML parse with no hint, for use, img and mask deliveries
- [ ] Per engine, the matrix records whether <link rel="preload" as="image" type="image/svg+xml"> (and as="fetch" and crossorigin variants) is reused by the <use> fetch, ignored, or causes a double download; same for the stack file and the 2-3 cold stack fetches ADR-0010 noted
- [ ] An ADR (accepted or rejected) decides: preload as a docs recommendation, an adapter helper that emits the <link> from the manifest URLs, or nothing, with the matrix as evidence
- [ ] docs/open-questions.md Q-23 is marked resolved with a link to the ADR, and a learning is recorded
- [ ] If a recommendation is accepted, the Next.js and Astro docs, both agent skills and llms.txt carry the same preload snippet

## Notes

## Learnings

## Progress Log

- [2026-10-14] Created