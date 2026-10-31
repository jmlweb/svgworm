---
"svgworm": minor
---

`svgworm init --cdn-url <https-url>` now works for Vue and Svelte. Before, it exited 2 for both. Next to `Icon.vue` or `Icon.svelte` it writes `SvgwormLoader.vue` or `SvgwormLoader.svelte`, which renders the `crossOrigin: "inject"` loader `<script>` with its `integrity`. Render `<SvgwormLoader />` once, in the root component (`App.vue`, or `app.vue` in Nuxt) or the root layout (`+layout.svelte` in SvelteKit). It works with server rendering and in client-only apps, checked in Chromium, Firefox and WebKit with Vue, Nuxt, Svelte and SvelteKit (ADR-0036). The interactive CDN question is now asked for every framework.
