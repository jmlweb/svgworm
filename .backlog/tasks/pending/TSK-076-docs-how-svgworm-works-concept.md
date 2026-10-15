---
id: TSK-076
title: Docs: How svgworm works concept page
status: pending
priority: P3
tags: [docs, concepts]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: How svgworm works concept page

## Description

From the 2026-10-15 docs copy review. The docs jump straight to setup steps; nothing explains the model behind the files svgworm writes, which readers need to debug delivery or color issues. Concept page only: usage belongs in the Icon reference task, the start-here layout in TSK-070.

## Acceptance Criteria

- [ ] A /docs/how-it-works/ page explains the sprite vs the stack file, why an external sprite, how each icon gets its delivery form (use, img, mask), the manifest and types, and determinism
- [ ] It links to the ADRs and spikes as evidence without requiring them
- [ ] The docs index (TSK-070) and both setup guides link to it
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created