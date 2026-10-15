---
id: TSK-035
title: Browser rendering matrix on product output (Playwright)
status: complete
priority: P3
tags: [testing, browsers, ci, post-v0.1]
created: 2026-10-12
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Browser rendering matrix on product output (Playwright)

## Description

`.claude/rules/testing.md` requires browser rendering checks for sprite features that differ between engines, with a committed matrix covering every delivery form the manifest can emit and the whole fixture set. Today that check exists only as the TSK-002 spike (`spikes/TSK-002-external-use/src/check.mjs`), which ran against hand-built sprites, not against `compile` output. Nothing in the test suite renders the product sprite in a browser, so a regression in `<use>`, `<img>` or mask delivery, or in mono recoloring, would reach a release unnoticed (LRN-017: WebKit ignores url() references in some forms; LRN-019: render checks need a same-origin HTTP server and integer pixel grids).

Port the spike's method into a repeatable script over the built core, decided by ADR-0006. Keep it out of `pnpm verify` if it is slow; run it as its own CI job. Discovered on 2026-10-13 while auditing the rules against the backlog after the v0.1 feature work.


## Acceptance Criteria

- [x] `pnpm render:check` builds the fixture set with the built core, serves it same-origin over HTTP, and compares every icon in every delivery form the manifest emits (`use`, `img`, `mask`) against the original fixture rendered as `<img>` by the same engine (Chromium, Firefox, WebKit), using the white+black background alpha recovery and the thresholds in `.claude/rules/testing.md` (fail on >1% of pixels with coverage Δ>64 or, for multicolor, color Δ>40; mono icons checked with `color:#ff0000`, ≥99% of opaque pixels red) — evidence: pnpm render:check exit 0: 53 pass, 0 fail, 4 skipped per engine (SMIL animation icons) (2026-10-15)
- [x] The generated matrix is committed under `tests/render/matrix.json` and CI fails when it changes, so its diff is reviewed like a snapshot — evidence: tests/render/matrix.json committed, byte-identical over 3 runs; CI git diff --exit-code (2026-10-15)
- [x] A CI job runs the check on Linux only, with Playwright browsers cached — evidence: ci.yml render job, ubuntu-latest, ~/.cache/ms-playwright cached by version (2026-10-15)
- [x] `docs/release.md` keeps the manual Safari and iOS check (Playwright WebKit is not Safari) and links to the matrix for everything else — evidence: docs/release.md step 3 keeps manual Safari/iOS, links the matrix (2026-10-15)
- [x] Playwright is added as a dev dependency only after the maintainer confirms (not implied by any existing task) — evidence: maintainer run instruction named TSK-035 (logged above) (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-12] Created
- [2026-10-15] Started
- [2026-10-15] Playwright authorization: the maintainer's run instruction (2026-10-15) names TSK-035 and asks for the Playwright rendering matrix in CI per .claude/rules/testing.md; taken as the confirmation of criterion 5. Delegated to a sonnet worktree agent (root devDependency playwright 1.58.2, matrix also covers crossOrigin inject use icons).
- [2026-10-15] scripts/render-check.mjs (sonnet worktree agent, commit e192a39 cherry-picked): fixtures compiled with the built core in default mode (/icons) and crossOrigin inject (/inject); same-origin HTTP; every icon in its form (use, img, mask, use-inject via the manifest loader tag) against the fixture as <img> in the same engine; white+black alpha recovery at deviceScaleFactor 2; testing.md thresholds; mono with color #ff0000 ≥99% red. 57 cells per engine: 53 pass, 4 skipped (animation/pulse-fill and animation/spin in use and use-inject: SMIL frames differ from the unpausable <img> reference). Matrix stores only pass/fail/skip so macOS and Linux agree (Linux not run locally). Sabotage checks: wrong use id → 46/53 fail per engine; mask without currentColor → mono mask cells fail; loader tag omitted → 23 cells fail. Root devDependencies playwright 1.58.2 and pngjs 7.0.0 (dev only). Rerun after the loader hardening: same matrix, exit 0. ~9 s.
- [2026-10-15] Completed