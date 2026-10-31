---
id: TSK-099
title: Spike: crossOrigin inject sprite loader for Vue and Svelte (init --cdn-url)
status: complete
priority: P3
tags: [spike, vue, svelte, cross-origin, init, adr]
created: 2026-10-16
source: manual
depends-on: []
started: 2026-10-31
completed: 2026-10-31
---

# Spike: crossOrigin inject sprite loader for Vue and Svelte (init --cdn-url)

## Description

Follow-up from TSK-092 / ADR-0034. Today `svgworm init --cdn-url` exits 2 for Vue and Svelte because neither framework gets a generated sprite loader for crossOrigin "inject" (ADR-0027). The generated Icon.vue and Icon.svelte already render `href="#id"` for version 2 manifests.

Open questions for the spike:
- Vue: templates refuse `<script>` tags. Options: a SvgwormLoader.vue built with a render function (`h('script', …)`), Nuxt `useHead`, or a documented line in `index.html`.
- Svelte: `<svelte:head>` content is inserted by template cloning, so a script may not execute on a client-only mount. Check SSR (SvelteKit) and SPA (Vite) separately.

Reference: the React `createSpriteLoader` and `SvgwormLoader.astro` in packages/svgworm/src/cli/init/plan.ts; method per ADR-0006 / testing rules (Playwright, same-origin HTTP page, per-engine reference).

## Acceptance Criteria

- [x] Browser matrix (Chromium, Firefox, WebKit) for SSR and client-only mounts in Vue, Nuxt, Svelte and SvelteKit
- [x] ADR superseding the --cdn-url limit of ADR-0034
- [x] init --cdn-url writes the loader for vue and svelte, or the docs give the manual step
- [x] Conformance tests cover the loader markup
- [x] Docs (vue.md, svelte.md, cli.md, llms.txt) and a changeset updated

## Notes

## Learnings

- LRN-061: Svelte 5 and Vue render functions run a <script> on client-only mounts
- LRN-062: SvelteKit 3, Node 25 and NODE_ENV=production traps when checking generated components
## Progress Log

- [2026-10-16] Created
- [2026-10-31] Started
- [2026-10-31] criterion 1 — evidence: spikes/TSK-099-vue-svelte-inject-loader (pnpm check, Node 24, Playwright 1.58.2) → 18/18 pass: Vue SPA, Nuxt SSR + ssr:false, Svelte SPA, SvelteKit SSR + ssr=false in Chromium, Firefox, WebKit; controls no-loader and no-integrity fail 0/18, src-first passes 18/18 (2026-10-31)
- [2026-10-31] criterion 2 — evidence: docs/adr/0036-vue-and-svelte-cdn-loader-through-init-generated-components.md accepted, supersedes the --cdn-url limit of ADR-0034 (status line updated) (2026-10-31)
- [2026-10-31] criterion 3 — evidence: pnpm --filter svgworm exec vitest run src/cli → 269 passed; plan.test.ts writes SvgwormLoader.vue/.svelte next to the component (vue, nuxt 4, svelte, sveltekit), run.test.ts init --cdn-url exits 0 for vue and svelte (2026-10-31)
- [2026-10-31] criterion 4 — evidence: tests/conformance/tests/loader-conformance.test.ts (both loaders match createSpriteLoader for v2 and render nothing for v1; fails when crossorigin is dropped) and types.test.ts (vue-tsc, svelte-check) → pnpm verify 875 passed (2026-10-31)
- [2026-10-31] criterion 5 — evidence: apps/site/src/content/docs/{vue,svelte,cli,config}.md, llms.txt, skills/*/SKILL.md, docs/output-contract.md updated; .changeset/vue-svelte-cdn-loader.md (svgworm minor); pnpm site:check → 0 (2026-10-31)
- [2026-10-31] Completed