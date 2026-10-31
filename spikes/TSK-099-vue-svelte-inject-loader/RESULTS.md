# TSK-099 spike: the crossOrigin "inject" loader in Vue, Nuxt, Svelte and SvelteKit

Question (ADR-0034 follow-up): can `svgworm init --cdn-url` write a loader component for Vue and Svelte that runs the ADR-0027 loader, pinned by `integrity`, after server rendering and after a client-only mount? Vue templates refuse `<script>`, and Svelte inserts markup by cloning a template, where a `<script>` does not run.

## Method

- `src/prepare.mjs` compiles one mono fixture (`mono-fill/figma-export.svg`) with the built core in `crossOrigin: "inject"` mode, rebuilds the loader for the local "CDN" origin with the core's `emitLoader`, and writes into every app the `Icon` and `SvgwormLoader` files that the built `init` generates (`vueComponentContent`, `vueLoaderContent`, `svelteComponentContent`, `svelteLoaderContent` from `packages/svgworm/dist/cli/init/plan.js`).
- `src/build.mjs` builds six apps into `out/`: Vue 3.5.44 as a Vite SPA, Nuxt 4.6.3 with SSR and with `ssr: false`, Svelte 5.57.2 as a Vite SPA (`mount`), and SvelteKit 3.1.1 (adapter-node) with SSR and with `ssr = false`. Each app renders `<SvgwormLoader />` in its root (`App.vue`, `app.vue`, `App.svelte`, `+layout.svelte`) and one `Icon` in `color: #ff0000`.
- Plain Vue and Svelte server rendering are covered through Nuxt and SvelteKit SSR, which render with `vue/server-renderer` and `svelte/server` and then hydrate, so the matrix has six apps rather than eight.
- `src/check.mjs` serves each app on `127.0.0.1` and the sprite and loader on `localhost:4311` with CORS, 120 ms per CDN response. For each app in Chromium, Firefox and WebKit (Playwright 1.58.2) it checks:
  - the loader tag is in the server HTML (SSR rows);
  - exactly one `svg[data-svgworm]` is injected and the icon paints (share of red pixels in a screenshot of the icon box);
  - unmounting and mounting the loader again keeps one sprite and the icon;
  - no hydration or mismatch message and no console error;
  - with a swapped loader on the CDN (code prepended), nothing runs and nothing is injected.

Run: `pnpm build` at the root, then here `pnpm install --ignore-workspace`, `pnpm prepare-apps`, `pnpm build-apps`, `pnpm check`. Use Node 24: SvelteKit 3.1.1's build calls `styleText('grey')`, which Node 25.8 rejects. On a host without WebKit's system libraries (`playwright install-deps`), set `WEBKIT_EXECUTABLE` to a wrapper that adds them to `LD_LIBRARY_PATH`; this run used libevent, libavif, libwoff2, libgav1 and libyuv extracted from the Ubuntu 24.04 packages without installing them, and `libjxl.so.0.8` as a symlink to Ubuntu's 0.7 (24.04 ships no 0.8). The spike decodes no JPEG XL image. `CONTROL=no-loader`, `CONTROL=no-integrity` and `CONTROL=src-first` on `prepare-apps` write broken loader variants (rebuild the apps after each).

## Results (2026-10-31): 18 of 18 cases pass

Full matrix: [results/matrix.md](results/matrix.md).

- **Every mount runs the loader** in all three engines: Vue SPA, Nuxt SSR, Nuxt `ssr: false`, Svelte SPA, SvelteKit SSR, SvelteKit `ssr = false`. One sprite, icon painted (0.45 red share everywhere).
- **Vue:** the render function `h('script', …)` is outside the template rule. Server rendering writes the tag; on a client-only mount Vue creates the element, sets its attributes and inserts it, and the browser runs it.
- **Svelte:** a `<script>` in `<svelte:head>` runs after a client-only mount too. The client runtime replaces script elements from a cloned template with new ones so that they run (`run_scripts` in `svelte/src/internal/client/dom/template.js`), and skips that while hydrating, because the server-rendered tag already ran.
- **SSR and hydration:** the tag is in the Nuxt and SvelteKit server HTML, hydration logs nothing, and the sprite is injected once.
- **Remount:** toggling the loader off and on keeps one sprite (the loader's `data-svgworm` guard).
- **Swapped loader:** refused in every case; the console shows `Failed to find a valid digest in the 'integrity' attribute …` (Chromium wording), `window.__pwned` stays unset, no sprite.

Controls, each over the full 18 cases:

| Control | Result | Shows |
|---------|--------|-------|
| `no-loader` (the component renders nothing) | 0 of 18 pass: no sprite, red share 0.00 | the check detects a missing loader |
| `no-integrity` (no `integrity` attribute) | 0 of 18 pass: the swapped loader runs and injects | the check detects a missing pin |
| `src-first` (`src` before `integrity` and `crossorigin`) | 18 of 18 pass | both frameworks set every attribute before they insert the element, so the order is a guard, not a requirement |

## Not covered

Real Safari and iOS (Playwright WebKit is not Safari); client navigation between routes in Nuxt or SvelteKit (the loader lives in the root, so it does not remount there; the toggle covers a remount); Svelte 4 and Vue 2 (below the ADR-0034 baseline).

## Side finding

SvelteKit 3 removed the `$lib` alias (`module_removed_lib`: "Use `#lib` instead"). The app here imports by relative path. `init`'s SvelteKit next step still says `$lib/components/Icon.svelte`.

Decision: [ADR-0036](../../docs/adr/0036-vue-and-svelte-cdn-loader-through-init-generated-components.md).
