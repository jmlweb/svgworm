# 0036. Vue and Svelte CDN loader through init-generated components

- **Status:** accepted
- **Date:** 2026-10-31
- **Task:** TSK-099
- **Supersedes:** [ADR-0034](0034-vue-and-svelte-support-through-init-generated-components.md) (its `--cdn-url` limit only)
- **Resolves:** no open question; the follow-up ADR-0034 left for crossOrigin `"inject"` in Vue and Svelte

## Context

`crossOrigin: "inject"` ([ADR-0027](0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md)) needs one loader `<script async src integrity crossorigin="anonymous">` in the page. React gets it from `createSpriteLoader`, Astro from a generated `SvgwormLoader.astro`. ADR-0034 made `svgworm init --cdn-url` exit 2 for Vue and Svelte, for two reasons:

- **Vue templates refuse `<script>` tags.** The template compiler drops them with a warning.
- **Svelte inserts markup by cloning a template.** A `<script>` created that way does not run, so a loader in `<svelte:head>` might not run after a client-only mount.

The generated `Icon.vue` and `Icon.svelte` already render `href="#id"` for a version 2 manifest. Only the loader tag was missing.

## Options considered

1. **A generated `SvgwormLoader.vue` and `SvgwormLoader.svelte`**, written by `init` next to the component, as for Astro. Vue renders the tag with a render function (`h('script', …)`), which the template rule does not touch. Svelte puts it in `<svelte:head>`. Same files for Nuxt and SvelteKit, no dependency.
2. **Framework head APIs.** Nuxt `useHead` or SvelteKit's `app.html`. Each covers one meta-framework only, and plain Vue and Svelte would still need option 1.
3. **A documented line in `index.html` or `app.html`.** No code to maintain. But the user copies a URL and an `integrity` by hand, and both change with every sprite change. A stale hash makes the browser refuse the loader, so every icon goes blank.

## Decision

Option 1. `svgworm init --cdn-url <https-url> --framework vue|svelte` writes the config as for React and Astro, plus a loader component next to `Icon.vue` or `Icon.svelte`:

- **`SvgwormLoader.vue`:** a `<script lang="ts">` block with `defineComponent` and a render function. It renders one `<script>` per sprite group that has a loader, with `async`, `crossorigin="anonymous"`, `integrity` and `src` from the manifest. It renders nothing for a version 1 manifest. Render it once, in the root component (`App.vue`, or `app.vue` in Nuxt).
- **`SvgwormLoader.svelte`:** the same tags in `<svelte:head>`, from an `{#each}` over the loaders. Render it once, in the root layout (`src/routes/+layout.svelte` in SvelteKit, `App.svelte` otherwise).
- **Attribute order:** `crossorigin` and `integrity` come before `src`, as in `createSpriteLoader`. Vue and Svelte set every attribute before they insert the element, so the order does not matter in these frameworks today (see Evidence). It guards a renderer that sets attributes on a connected script, which starts loading as soon as `src` is set.
- `init` no longer refuses `--cdn-url` for any framework, and the interactive CDN question is asked for all of them. The next steps name the loader file and where it goes.
- **Drift guard:** `tests/conformance` renders both loaders on the server next to `createSpriteLoader`, for a version 2 manifest with two loaders and one group without, and for a version 1 manifest. It also type-checks both files with `vue-tsc` and `svelte-check`.

## Evidence

Spike [`spikes/TSK-099-vue-svelte-inject-loader`](../../spikes/TSK-099-vue-svelte-inject-loader/RESULTS.md), 18 of 18 cases passing ([matrix](../../spikes/TSK-099-vue-svelte-inject-loader/results/matrix.md)). It builds six real apps with the files the built `init` writes: Vue 3.5.44 (Vite SPA), Nuxt 4.6.3 (SSR, and `ssr: false`), Svelte 5.57.2 (Vite SPA with `mount`), and SvelteKit 3.1.1 (SSR, and `ssr = false`). Nuxt and SvelteKit SSR stand for plain Vue and Svelte server rendering: they render with `vue/server-renderer` and `svelte/server` and hydrate. WebKit ran with host libraries extracted from Ubuntu packages, `libjxl` 0.7 standing in for 0.8 (no JPEG XL image is decoded). The spike serves the apps on one origin and the sprite and loader on another, and checks Chromium, Firefox and WebKit (Playwright 1.58.2):

- **The loader runs in every case.** One sprite is injected, and the mono icon paints red (45% of its box, the same in every engine).
- **SSR puts the tag in the server HTML** for Nuxt and SvelteKit. Hydration keeps it, logs no mismatch, and does not inject twice.
- **Svelte runs a `<script>` from `<svelte:head>` after a client-only mount.** The ADR-0034 concern does not hold for Svelte 5.57: the client runtime recreates script elements that come from a cloned template (`run_scripts` in `svelte/src/internal/client/dom/template.js`), and skips that while hydrating, because the server-rendered tag already ran.
- **Unmounting and mounting the loader again** (a layout change) keeps exactly one sprite.
- **A swapped loader is refused.** The CDN prefixes the loader with code; the browser blocks it ("Failed to find a valid digest in the 'integrity' attribute"), nothing runs, and nothing is injected.
- **Controls show that the check can fail.** With no loader tag, all 18 cases fail (no sprite, no red pixels). Without `integrity`, all 18 fail because the swapped loader runs. With `src` written before `integrity` and `crossorigin`, all 18 still pass, which is why the attribute order is a guard and not a requirement.

## Consequences

- Vue, Nuxt, Svelte and SvelteKit apps can opt into a CDN with one `init` run, like React and Astro.
- Five renderers of the loader tag now exist (React, Astro, Vue, Svelte, plain HTML in the docs). The conformance tests cover Vue and Svelte against React.
- A change to the loader tag touches `createSpriteLoader`, `SvgwormLoader.astro`, and both new templates.
- Not checked: real Safari and iOS, client navigation between Nuxt or SvelteKit routes (the loader stays in the root, so it does not remount), and Svelte 4 (below the ADR-0034 baseline).
