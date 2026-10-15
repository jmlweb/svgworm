---
id: TSK-021
title: Multiple sprites (namespace or config groups)
status: complete
priority: P3
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Multiple sprites (namespace or config groups)

## Description

Deferred past v0.1. Open question Q-22 and R-44. Adapter already resolves the sprite URL from the manifest, so this should not change the component.

## Acceptance Criteria

- [x] Decision on Q-22 recorded in an ADR — evidence: docs/adr/0023-several-sprites-through-one-config-per-sprite.md (2026-10-15)
- [x] Scope defined before work starts — evidence: scope: docs recipe only, no code; site:check green (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-15] Started
- [2026-10-15] ADR-0023 accepted: no built-in groups or size limit; several sprites = one config per sprite with its own outDir/publicPath/moduleDir (recipe run with the built CLI, check up to date for both). Measured lucide-static@0.545.0: 1,866 icons, 538.8 KiB raw, 75 KiB gzip. Docs: config 'Several sprites', nextjs/astro performance notes, comparison, llms.txt, both skills, output-contract, requirements R-44, Q-22 resolved.
- [2026-10-15] Completed