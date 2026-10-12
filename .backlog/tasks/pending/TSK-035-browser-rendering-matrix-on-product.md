---
id: TSK-035
title: Browser rendering matrix on product output (Playwright)
status: pending
priority: P3
tags: [testing, browsers, ci, post-v0.1]
created: 2026-10-12
source: manual
depends-on: []
---

# Browser rendering matrix on product output (Playwright)

## Description

`.claude/rules/testing.md` requires browser rendering checks for sprite features that differ between engines, with a committed matrix covering every delivery form the manifest can emit and the whole fixture set. Today that check exists only as the TSK-002 spike (`spikes/TSK-002-external-use/src/check.mjs`), which ran against hand-built sprites, not against `compile` output. Nothing in the test suite renders the product sprite in a browser, so a regression in `<use>`, `<img>` or mask delivery, or in mono recoloring, would reach a release unnoticed (LRN-017: WebKit ignores url() references in some forms; LRN-019: render checks need a same-origin HTTP server and integer pixel grids).

Port the spike's method into a repeatable script over the built core, decided by ADR-0006. Keep it out of `pnpm verify` if it is slow; run it as its own CI job. Discovered on 2026-10-13 while auditing the rules against the backlog after the v0.1 feature work.


## Acceptance Criteria

- [ ] `pnpm render:check` builds the fixture set with the built core, serves it same-origin over HTTP, and compares every icon in every delivery form the manifest emits (`use`, `img`, `mask`) against the original fixture rendered as `<img>` by the same engine (Chromium, Firefox, WebKit), using the white+black background alpha recovery and the thresholds in `.claude/rules/testing.md` (fail on >1% of pixels with coverage Δ>64 or, for multicolor, color Δ>40; mono icons checked with `color:#ff0000`, ≥99% of opaque pixels red)
- [ ] The generated matrix is committed under `tests/render/matrix.json` and CI fails when it changes, so its diff is reviewed like a snapshot
- [ ] A CI job runs the check on Linux only, with Playwright browsers cached
- [ ] `docs/release.md` keeps the manual Safari and iOS check (Playwright WebKit is not Safari) and links to the matrix for everything else
- [ ] Playwright is added as a dev dependency only after the maintainer confirms (not implied by any existing task)

## Notes

## Learnings

## Progress Log

- [2026-10-12] Created