---
id: TSK-101
title: One source of truth for the Icon delivery logic across React, Astro, Vue and Svelte
status: pending
priority: P4
tags: [adapter, init, vue, svelte, astro, react, adr]
created: 2026-10-16
source: manual
depends-on: []
---

# One source of truth for the Icon delivery logic across React, Astro, Vue and Svelte

## Description

From the PR #14 review (TSK-092). The manifest types and the use/img/mask delivery logic (version check, Object.hasOwn lookup, fileUrl, viewBox size, a11y, mask style) now live in four places: createIcon in @svgworm/react and the Icon.astro, Icon.vue and Icon.svelte templates in packages/svgworm/src/cli/init/plan.ts. The conformance tests (apps/site, tests/conformance) catch drift, but every delivery change touches four files. Investigate whether one shared, dependency-free implementation is worth an output-contract change; ADR-0017 and ADR-0034 chose duplication for zero-dependency components.

## Acceptance Criteria

- [ ] Spike compares options: a dependency-free helper generated into the moduleDir (output-contract change), a shared template fragment in plan.ts, or keeping the duplication
- [ ] ADR records the choice (an output-contract change needs its own ADR and semver note)
- [ ] If adopted: React, Astro, Vue and Svelte read the shared logic and the conformance tests still pass unchanged

## Notes

## Learnings

## Progress Log

- [2026-10-16] Created