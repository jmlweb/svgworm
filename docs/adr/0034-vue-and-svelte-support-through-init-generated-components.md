# 0034. Vue and Svelte support through init-generated components

- **Status:** accepted; its `--cdn-url` limit is superseded by [0036](0036-vue-and-svelte-cdn-loader-through-init-generated-components.md)
- **Date:** 2026-10-16
- **Task:** TSK-092
- **Resolves:** no open question; the Vue and Svelte gap ADR-0017 left (TSK-092)

## Context

svgworm renders icons in React (`@svgworm/react`) and Astro (an `Icon.astro` written by `svgworm init`, ADR-0017). Every Vue, Nuxt, Svelte or SvelteKit team is blocked. SVGR equivalents, the Vite sprite plugins and Iconify all serve them.

Principles 1, 3 and 4 apply as they did for Astro. The core stays framework-agnostic, the output contract does not change, the component must not need client JS to show an icon, and an unknown icon name must be a type error.

## Options considered

1. **Init-generated components** (`Icon.vue`, `Icon.svelte`), as in ADR-0017. There is no new package and no runtime dependency. The types come from the generated `IconName`. Cost: the delivery logic exists in four places. A conformance test per framework guards against drift.
2. **`@svgworm/vue` and `@svgworm/svelte` packages.** Each has one maintained implementation. But each package needs its own release surface and peer range. A Svelte package also has to ship `.svelte` sources for the user's compiler to process. All that for a component of about 100 lines.
3. **A docs recipe only.** No code to keep in step, but every user copies a component by hand, and nothing catches drift.

## Decision

Option 1. `svgworm init --framework vue|svelte` writes a dependency-free component. It is typed with the generated `IconName` and has the same `use` / `img` / `mask` delivery, accessibility defaults and errors as `createIcon`.

- **Vue:** `Icon.vue` with `<script setup lang="ts">` and `defineProps`. It uses `inheritAttrs: false` and binds `useAttrs()` itself, so `class`, `style` and other attributes land where `createIcon` puts them. `style` takes anything Vue accepts.
- **Svelte:** `Icon.svelte` with Svelte 5 runes (`$props()`, `$derived`). Props are typed with `SVGAttributes` from `svelte/elements`. `style` is a string, as Svelte works.
- **Baseline (principle 8):** Vue 3.5 and Svelte 5. Nuxt and SvelteKit are covered through the Vue and Svelte versions they run on; the Nuxt 4 `app/` folder sets the default path.
- **Detection:** `vue` or `nuxt` means vue, and `svelte` or `@sveltejs/kit` means svelte. The precedence is astro, vue, svelte, react: meta-frameworks first, because an Astro site may carry Vue or Svelte integrations and a Vue app may still depend on react. With more than one candidate, a TTY run asks with a select of the detected ones. A non-TTY run takes the first and reports `framework` and `frameworkSource: "detected"`. This generalizes the ADR-0017 rule.
- **Default paths:** `src/lib/components/Icon.svelte` for SvelteKit, so it is imported as `$lib/components/Icon.svelte`. `app/components/Icon.vue` for Nuxt 4 with an `app/` folder and no root `app.vue` (its `app/` srcDir), and `components/Icon.vue` otherwise, including Nuxt 3, which uses `app/` only for files such as `router.options.ts`. The Nuxt major comes from the declared `nuxt` range; a range without one (`latest`) counts as 4. In both cases Nuxt auto-imports it as `<Icon>`. With `@nuxt/icon`, Nuxt UI or `nuxt-icon` as a dependency, the file is `SvgIcon.vue` (rendered as `<SvgIcon>`), because those modules already register a global `<Icon>`. Otherwise `src/components/` when `src/` exists, or `components/`.
- **SvelteKit output folder:** SvelteKit serves `static/`, not `public/`. With no `--out-dir`, init writes `"outDir": "static/icons"` and `"publicPath": "/icons"` for SvelteKit. Vite, Nuxt and every other framework keep the `public/icons` default (ADR-0010).
- **Extension check:** `--component-file` must end in `.vue` or `.svelte` for those frameworks. A mismatch exits 2, as in ADR-0017.
- **`--cdn-url` is not supported for Vue and Svelte yet.** It exits 2 and points to the docs. crossOrigin `"inject"` needs a loader `<script>` (ADR-0027). Vue templates refuse `<script>` tags, and Svelte inserts `<svelte:head>` content by cloning a template, so a script written that way may not run on a client-only mount. Both need a spike before init writes a loader. The component itself already reads version 2 manifests (`href="#id"`).
- **Solid is out for now.** Server rendering it in a test needs `babel-preset-solid`, and no user has asked for it. `--framework solid` stays possible as an additive value.
- **Flag contract:** `vue` and `svelte` are new values of `--framework`, so this is a minor (ADR-0017's rule).
- **Drift guard:** the private workspace `tests/conformance` compiles each template for the server the way a bundler does: `vue/compiler-sfc` with an inline SSR template, and `svelte/compiler` with `generate: "server"`. It renders each next to `createIcon` from the same fixture manifest as the Astro test, and compares markup with one shared normalizer (`tests/conformance/normalize.ts`, also used by `apps/site`). It also runs `vue-tsc` and `svelte-check` on the generated files, with a usage that expects an unknown name to be a type error.

## Evidence

- Nuxt docs (Context7, `/websites/nuxt_4_x`): `srcDir` defaults to `app` in Nuxt 4 and Nuxt keeps auto-detecting the Nuxt 3 layout; `@nuxt/icon` registers `<Icon>` unless `icon.componentName` changes it (`/nuxt/icon`). Both rules came from the PR #14 review, before this ADR reached `main`.
- Context7 docs. Svelte (`/sveltejs/svelte`): `render` from `svelte/server`, and `<script lang="ts">` with type-only syntax needs no preprocessor. Vue (`/vuejs/core`): `renderToString` from `vue/server-renderer`, the `compileScript` and `compileTemplate` workflow of `@vue/compiler-sfc`, and `defineProps<T>()` falling back to a `null` runtime type for an unresolved imported type.
- Conformance run (2026-10-16, Vue 3.5.44, Svelte 5.57.2, React 19.3.0): 34 markup cases, plus the type checks, pass. They cover every delivery, title, label, size, class, style, `id`, `data-*`, `aria-*`, a viewBox origin other than `0 0`, unknown and prototype names, and a missing stack file. Writing the test found two framework differences. The test adjusts for them, and nothing else is adjusted:
  - Vue's server renderer lowercases attribute names bound through a `v-bind` object, even on `<svg>` (`viewbox`). The HTML parser restores the SVG case ("adjust SVG attributes" in the HTML parsing spec), so the DOM has `viewBox`. Client-side rendering uses `setAttribute` with the right case.
  - Svelte adds `onload="this.__e=event"` and `onerror` to an `<img>` with spread attributes, to replay events on hydration (`svelte/src/compiler/phases/3-transform/server/visitors/shared/element.js`). They are inline handlers: a strict Content-Security-Policy blocks them, and the image still loads.
- Removing the expected-error marker makes `vue-tsc` and `svelte-check` report `Type '"nope"' is not assignable to type '"home"'`. The type check does check names.

## Consequences

- A Vue, Nuxt, Svelte or SvelteKit app costs one `init` run and no extra dependency.
- The four renderers (React, Astro, Vue, Svelte) must change together. The conformance tests fail on drift.
- `tests/conformance` adds dev-only dependencies: `vue`, `svelte`, `vue-tsc` and `svelte-check`. Nothing is added to the published packages.
- Follow-ups: crossOrigin inject loaders for Vue and Svelte (spike first). Site docs `vue` and `svelte`.
