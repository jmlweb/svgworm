---
id: TSK-092
title: Vue and Svelte icon components through init --framework
status: complete
priority: P3
tags: [init, adapter, vue, svelte, solid, competitors, adr]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-16
completed: 2026-10-16
---

# Vue and Svelte icon components through init --framework

## Description

Competitor gap: SVGR equivalents, the Vite sprite plugins and Iconify serve Vue and Svelte. svgworm supports only React (`@svgworm/react`) and Astro (`Icon.astro` from `init`, ADR-0017). Every Vue, Nuxt, Svelte or SvelteKit team is blocked today.

Approach: repeat the ADR-0017 pattern. Add a template next to `astroComponentContent` in `packages/svgworm/src/cli/init/plan.ts`, add values to the `Framework` const map, and guard drift with a conformance test like `apps/site/tests/icon-conformance.test.ts`. No new published package. Solid only if the conformance harness makes it cheap. The `crossOrigin: "inject"` loader needs a per-framework equivalent of `SvgwormLoader.astro`, or a documented limit.

Do after RPT-007.

## Acceptance Criteria

- [x] ADR records Vue and Svelte (and Solid, or why not) support through init-generated templates, following ADR-0017, with the supported version baseline (principle 8) — evidence: manual: docs/adr/0034-*.md written, Solid reason + Vue 3.5/Svelte 5 baseline (2026-10-16)
- [x] init --framework vue|svelte writes a dependency-free component typed with the generated IconName, with the same use/img/mask delivery, accessibility defaults and errors as createIcon — evidence: pnpm verify → exit 0, 803 tests passed (conformance included) (2026-10-16)
- [x] Detection from dependencies, the --component-file extension check and plain/--json output cover the new values, with tests in plan.test.ts — evidence: vitest src/cli → 202 passed (plan, run, args tests) (2026-10-16)
- [x] A conformance test renders each template and createIcon from the same fixture manifest and compares normalized markup — evidence: tests/conformance vitest → 36 passed (2026-10-16)
- [x] Site docs (a guide per framework or one shared page), llms.txt and init --help updated; changeset added — evidence: pnpm site:check → exit 0; manual: .changeset/init-vue-and-svelte.md (2026-10-16)

## Notes

## Learnings

- LRN-054: Vue SSR lowercases attribute names bound through a v-bind object
- LRN-055: Svelte SSR adds inline onload/onerror replay handlers to an img with spread attributes
- LRN-056: SvelteKit serves static/, not public/: sprite outDir must follow
- LRN-057: Server-render Vue SFCs and Svelte components in Vitest without bundler plugins
## Progress Log

- [2026-10-15] Created
- [2026-10-16] Started
- [2026-10-16] Implemented init --framework vue|svelte (Icon.vue, Icon.svelte), detection precedence astro>vue>svelte>react, SvelteKit static/icons default, --cdn-url limit (exit 2); ADR-0034 written (proposed).
- [2026-10-16] Added tests/conformance workspace: 34 markup cases vs createIcon, vue-tsc and svelte-check with an invalid-name check. Updated docs (vue, svelte, cli, icon, troubleshooting, comparison), landing cards, llms.txt, READMEs, context7.json, AGENTS.md, architecture.md, help; changeset added.
- [2026-10-16] Next: user accepts ADR-0034 and picks a branch; add follow-up task for Vue/Svelte CDN loaders.
- [2026-10-16] ADR-0034 accepted by the maintainer.
- [2026-10-16] Completed