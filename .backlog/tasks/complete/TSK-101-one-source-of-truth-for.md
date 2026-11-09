---
id: TSK-101
title: One source of truth for the Icon delivery logic across React, Astro, Vue and Svelte
status: complete
priority: P4
tags: [adapter, init, vue, svelte, astro, react, adr]
created: 2026-10-16
source: manual
depends-on: []
started: 2026-11-09
completed: 2026-11-09
---

# One source of truth for the Icon delivery logic across React, Astro, Vue and Svelte

## Description

From the PR #14 review (TSK-092). The manifest types and the use/img/mask delivery logic (version check, Object.hasOwn lookup, fileUrl, viewBox size, a11y, mask style) now live in four places: createIcon in @svgworm/react and the Icon.astro, Icon.vue and Icon.svelte templates in packages/svgworm/src/cli/init/plan.ts. The conformance tests (apps/site, tests/conformance) catch drift, but every delivery change touches four files. Investigate whether one shared, dependency-free implementation is worth an output-contract change; ADR-0017 and ADR-0034 chose duplication for zero-dependency components.

## Acceptance Criteria

- [x] Spike compares options: a dependency-free helper generated into the moduleDir (output-contract change), a shared template fragment in plan.ts, or keeping the duplication
- [x] ADR records the choice (an output-contract change needs its own ADR and semver note)
- [x] If adopted: React, Astro, Vue and Svelte read the shared logic and the conformance tests still pass unchanged

## Notes

## Learnings

- LRN-065: A helper generated into moduleDir cannot serve the published React adapter
## Progress Log

- [2026-10-16] Created
- [2026-11-09] Started
- [2026-11-09] criterion 1 — evidence: spikes/TSK-101-shared-icon-delivery/RESULTS.md compares a moduleDir helper, a plan.ts fragment and keeping the duplication; comm -12 over the rendered templates and create-icon.tsx → 25 lines common to all four (types and punctuation), 43 to the three templates (2026-11-09)
- [2026-11-09] criterion 2 — evidence: docs/adr/0037-keep-per-framework-icon-renderers-guarded-by-conformance-tests.md accepted; no output-contract change, so no contract ADR or semver note is needed (2026-11-09)
- [2026-11-09] criterion 3 — not applicable: ADR-0037 does not adopt a single source across React, Astro, Vue and Svelte; React keeps its own copy. Only the byte-identical manifest types block is shared inside plan.ts (ICON_MANIFEST_TYPES). evidence: diff -r of rendered Icon.astro/Icon.vue/Icon.svelte/loaders before vs after → identical; NODE_ENV= pnpm verify → 890 tests passed, conformance tests unchanged; pnpm site:check → exit 0. No new test: the change is a byte-identical refactor covered by the existing conformance and plan tests (2026-11-09)
- [2026-11-09] Completed