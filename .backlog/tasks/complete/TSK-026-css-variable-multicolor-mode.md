---
id: TSK-026
title: CSS-variable multicolor mode
status: complete
priority: P4
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# CSS-variable multicolor mode

## Description

Deferred past v0.1. Q-12: a custom-property mode (--icon-color-1 and so on) for multicolor theming.

## Acceptance Criteria

- [x] Decision on Q-12 recorded in an ADR — evidence: docs/adr/0026-no-generated-css-variable-color-mode.md; spikes/TSK-026-css-variable-paint/results/matrix.md 9/9 (2026-10-15)

## Notes

## Learnings

- LRN-044: Custom properties reach var() paints inside an external use sprite
## Progress Log

- [2026-10-07] Created
- [2026-10-15] Started
- [2026-10-15] ADR-0026 accepted: no generated CSS-variable mode; author-written var() paints are the theming hook. Spike spikes/TSK-026-css-variable-paint: custom properties reach var() paints through an external <use> in Chromium, Firefox, WebKit (9/9). Docs: how-it-works color note, Q-12 resolved.
- [2026-10-15] Completed