---
id: TSK-092
title: Vue and Svelte icon components through init --framework
status: pending
priority: P3
tags: [init, adapter, vue, svelte, solid, competitors, adr]
created: 2026-10-15
source: manual
depends-on: []
---

# Vue and Svelte icon components through init --framework

## Description

Competitor gap: SVGR equivalents, the Vite sprite plugins and Iconify serve Vue and Svelte. svgworm supports only React (`@svgworm/react`) and Astro (`Icon.astro` from `init`, ADR-0017). Every Vue, Nuxt, Svelte or SvelteKit team is blocked today.

Approach: repeat the ADR-0017 pattern. Add a template next to `astroComponentContent` in `packages/svgworm/src/cli/init/plan.ts`, add values to the `Framework` const map, and guard drift with a conformance test like `apps/site/tests/icon-conformance.test.ts`. No new published package. Solid only if the conformance harness makes it cheap. The `crossOrigin: "inject"` loader needs a per-framework equivalent of `SvgwormLoader.astro`, or a documented limit.

Do after RPT-007.

## Acceptance Criteria

- [ ] ADR records Vue and Svelte (and Solid, or why not) support through init-generated templates, following ADR-0017, with the supported version baseline (principle 8)
- [ ] init --framework vue|svelte writes a dependency-free component typed with the generated IconName, with the same use/img/mask delivery, accessibility defaults and errors as createIcon
- [ ] Detection from dependencies, the --component-file extension check and plain/--json output cover the new values, with tests in plan.test.ts
- [ ] A conformance test renders each template and createIcon from the same fixture manifest and compares normalized markup
- [ ] Site docs (a guide per framework or one shared page), llms.txt and init --help updated; changeset added

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created