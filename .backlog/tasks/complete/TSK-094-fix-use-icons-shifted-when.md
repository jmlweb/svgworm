---
id: TSK-094
title: Fix use icons shifted when the viewBox origin is not 0 0
status: complete
priority: P1
tags: [bug, react, astro, render]
created: 2026-10-15
source: RPT-006
depends-on: []
completed: 2026-10-15
started: 2026-10-15
---

# Fix use icons shifted when the viewBox origin is not 0 0

## Description

Adapters put the icon's full viewBox on the consumer <svg>; <use> draws the symbol at 0,0, so a non-zero origin shifts and clips the icon in every engine. Fix: consumer viewBox keeps only the size (ADR-0030).

## Acceptance Criteria

- [x] Fixtures with a non-zero viewBox origin fail render:check before the fix and pass after — evidence: render:check: 12 failing cells before, 57 pass x3 engines after; matrix.json +24 lines (2026-10-15)
- [x] @svgworm/react and the Icon.astro template render viewBox="0 0 W H", with unit and conformance tests — evidence: create-icon.test.tsx offset test; plan.test.ts; apps/site icon-conformance 15 passed (2026-10-15)
- [x] Output contract, ADR-0030 (partially superseding ADR-0006 point 5) and icon docs updated — evidence: docs/output-contract.md, docs/adr/0030, ADR-0006 status, apps/site docs icon.md (2026-10-15)
- [x] Changeset for both packages, with the Astro regeneration note — evidence: .changeset/viewbox-origin-use.md (2026-10-15)
- [x] pnpm verify, typecheck:ts7, determinism, site and example checks pass; the four bench folders re-checked — evidence: verify, typecheck:ts7, determinism:fingerprint, site:check, example:check, example:vite:check exit 0; Supabase docs 466/466, studio 217/217, Refine 274/274; cal.com 498/510 (6 flags draw outside their own viewBox, letterbox artifact) (2026-10-15)

## Notes

## Learnings

- LRN-047: <use> draws a symbol at 0,0: the consumer viewBox must not carry the icon's origin
## Progress Log

- [2026-10-15] Created
- [2026-10-15] Fixed per plan: consumer viewBox keeps only the size. Harness also gives no-viewBox references the derived viewBox. Remaining cal.com cells are flags whose drawing overflows their viewBox: the reference <img> shows the overflow in the letterbox, the symbol clips; identical in a box of the icon's own ratio.
- [2026-10-15] Completed