---
id: TSK-003
title: Spike: per-icon color classification
status: complete
priority: P1
tags: [spike, color, adr]
created: 2026-10-07
source: manual
depends-on: [TSK-001]
started: 2026-10-07
completed: 2026-10-07
---

# Spike: per-icon color classification

## Description

Resolve Q-10, Q-11, Q-12, Q-04 (style scoping strategy, since `<style>` often carries color). Design heuristic to classify mono / stroke / multicolor and how currentColor is applied. Measure accuracy on fixture corpus. Define override mechanism (per icon/folder).

## Acceptance Criteria

- [x] Heuristic documented with >=95% accuracy on fixtures or gaps listed
- [x] Override mechanism specified
- [x] ADR written (ADR-0004, accepted)
- [x] open-questions.md updated
- [x] Learning added

## Notes

## Learnings

- LRN-005: Transparent gradient stops still tint color
- LRN-006: Recolor masks only after freezing inherited fill
- LRN-007: resvg-js returns premultiplied pixels and can abort
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-07] Spike spikes/TSK-003-color-classification: static mono/multicolor classifier vs render oracle (resvg) on 31,390 icons from 11 OSS packages + synthetic Figma/Illustrator exports. 99.98% agreement, 0 dangerous errors, 100% of 21,667 mono rewrites render identical in probe color. Per-element rewrite answers Q-11; style inlining covers all 929 style cases (Q-04 partly); Q-12 deferred. ADR-0004 written (proposed, awaiting acceptance). LRN-005..007 added. Open: browser parity (TSK-002), markers/CSS vars/animations not covered
- [2026-10-07] ADR-0004 accepted by user. All criteria met
- [2026-10-07] Completed