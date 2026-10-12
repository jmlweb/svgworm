---
id: TSK-027
title: Color classification edge cases: markers, CSS variables, animations
status: complete
priority: P4
tags: [post-v0.1, color]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-12
completed: 2026-10-12
---

# Color classification edge cases: markers, CSS variables, animations

## Description

Deferred past v0.1. ADR-0004 does not cover markers, CSS variables or animations inside SVGs. Needs fixtures first (OSS-licensed only, per testing.md).

## Acceptance Criteria

- [x] Fixtures added for each edge case, with license recorded
- [x] Classification rule decided per case in an ADR or ADR-0004 addendum

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Fixtures: markers/arrow-mono, markers/arrow-two-tone, css-variables/themed-fill, animation/pulse-fill, animation/spin (CC0, written for svgworm; LICENSES.md and README updated).
- [2026-10-12] Classifier follows marker-start/mid/end references from the root state and counts their paints; var( paints and SMIL animate/set on paint properties raise flags (variable, animation) that force multicolor and skip the rewrite. ADR-0013 accepted; ADR-0004 consequences point at it. Fixture snapshots updated and reviewed.
- [2026-10-12] Render evidence (resvg 2.6.2): rewritten markers/arrow-mono keeps the same alpha coverage (1424 px at 96 px) and is 100% red with color #ff0000; animation/spin likewise. Note: the first run showed 15.7% because dist was stale; rebuilt and rerun.
- [2026-10-12] Completed