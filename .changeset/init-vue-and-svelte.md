---
"svgworm": minor
---

`svgworm init` sets up Vue, Nuxt, Svelte and SvelteKit apps. It detects `vue`, `nuxt`, `svelte` or `@sveltejs/kit` (or takes `--framework vue|svelte`). It writes a dependency-free `Icon.vue` (Vue 3.5, `<script setup>`) or `Icon.svelte` (Svelte 5 runes), typed with the generated `IconName`. Both render the same markup as `createIcon` from `@svgworm/react`.

- **Nuxt 4:** the component goes to `app/components/`, where Nuxt auto-imports it.
- **SvelteKit:** the component goes to `src/lib/components/`, and the sprites go to `static/icons/`.

When several frameworks are dependencies, a terminal asks which one to use. Otherwise the first of Astro, Vue, Svelte, React is picked and reported. `--component-file` must end in `.vue` or `.svelte` for those frameworks. `--cdn-url` is not supported for Vue and Svelte yet, and `init` exits 2 (ADR-0034).
