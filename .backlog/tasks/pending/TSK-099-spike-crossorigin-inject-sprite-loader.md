---
id: TSK-099
title: Spike: crossOrigin inject sprite loader for Vue and Svelte (init --cdn-url)
status: pending
priority: P3
tags: [spike, vue, svelte, cross-origin, init, adr]
created: 2026-10-16
source: manual
depends-on: []
---

# Spike: crossOrigin inject sprite loader for Vue and Svelte (init --cdn-url)

## Description

Follow-up from TSK-092 / ADR-0034. Today `svgworm init --cdn-url` exits 2 for Vue and Svelte because neither framework gets a generated sprite loader for crossOrigin "inject" (ADR-0027). The generated Icon.vue and Icon.svelte already render `href="#id"` for version 2 manifests.

Open questions for the spike:
- Vue: templates refuse `<script>` tags. Options: a SvgwormLoader.vue built with a render function (`h('script', …)`), Nuxt `useHead`, or a documented line in `index.html`.
- Svelte: `<svelte:head>` content is inserted by template cloning, so a script may not execute on a client-only mount. Check SSR (SvelteKit) and SPA (Vite) separately.

Reference: the React `createSpriteLoader` and `SvgwormLoader.astro` in packages/svgworm/src/cli/init/plan.ts; method per ADR-0006 / testing rules (Playwright, same-origin HTTP page, per-engine reference).

## Acceptance Criteria

- [ ] Browser matrix (Chromium, Firefox, WebKit) for SSR and client-only mounts in Vue, Nuxt, Svelte and SvelteKit
- [ ] ADR superseding the --cdn-url limit of ADR-0034
- [ ] init --cdn-url writes the loader for vue and svelte, or the docs give the manual step
- [ ] Conformance tests cover the loader markup
- [ ] Docs (vue.md, svelte.md, cli.md, llms.txt) and a changeset updated

## Notes

## Learnings

## Progress Log

- [2026-10-16] Created