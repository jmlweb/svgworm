---
id: TSK-076
title: Docs: How svgworm works concept page
status: complete
priority: P3
tags: [docs, concepts]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: How svgworm works concept page

## Description

From the 2026-10-15 docs copy review. The docs jump straight to setup steps; nothing explains the model behind the files svgworm writes, which readers need to debug delivery or color issues. Concept page only: usage belongs in the Icon reference task, the start-here layout in TSK-070.

## Acceptance Criteria

- [x] A /docs/how-it-works/ page explains the sprite vs the stack file, why an external sprite, how each icon gets its delivery form (use, img, mask), the manifest and types, and determinism — evidence: how-it-works.md: The sprite, Color, Delivery (table use/img/mask), The manifest and the types, Names, Deterministic output (2026-10-15)
- [x] It links to the ADRs and spikes as evidence without requiring them — evidence: ADR-0001, 0004, 0006, 0007, 0014 and the output contract linked as evidence, each sentence readable without them (2026-10-15)
- [x] The docs index (TSK-070) and both setup guides link to it — evidence: docs index lists every doc automatically (apps/site/src/pages/docs/index.astro); nextjs.md and astro.md Next lists link /docs/how-it-works/; README and llms.txt too (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset.
- [2026-10-15] Completed