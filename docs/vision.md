# Vision

## Problem

Teams with tens to thousands of custom SVG icons usually pick one of these:

- **Component per icon** (e.g. SVGR). Every icon becomes JS. It bloats bundles and hydration, and server-rendered HTML repeats the path data on every use.
- **Inline sprite**. Every page response carries the full sprite. It can't be cached separately and grows with the icon set.
- **Icon fonts**. Mono only, poor accessibility, and blurry rendering.
- **Hand-made sprite files**. Cacheable and zero-JS, but untyped. A wrong name fails silently at runtime, and nothing keeps the sprite in sync with the source folder.

## Solution

A CLI that generates cacheable, hashed sprite files, a manifest, and types from a folder of SVGs, plus thin framework adapters. The default path ships **zero client JavaScript** and gives **compile-time checks on icon names**.

## Target users

- Front-end teams with a custom icon set (design-system owners).
- Apps that render on the server (React Server Components, SSR, static sites) and care about HTML size and JS budget.
- Framework-agnostic consumers (plain HTML, Vue, Svelte) through the core output. Astro is supported through a generated `Icon.astro`; other adapters come later.

## Positioning

"Icon sprites for Next.js App Router and Server Components, correct with zero config: drop in your design team's SVGs and they theme and render correctly, with zero client JS and no bundler plugin required."

The optional `svgworm/vite` plugin ([ADR-0033](adr/0033-optional-vite-plugin-as-a-svgworm-vite-subpath.md)) rebuilds icons inside `vite dev`. It is sugar over the CLI, never the only working path.

Decided in [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md), after the competitor review ([viability.md](viability.md#neodxsvg-in-detail)).

Differentiators, in order of weight:

1. **Per-icon color with zero config.** Mono icons follow `currentColor`; multicolor icons are never touched; masks and clip paths keep working. Verified on 31k icons ([ADR-0004](adr/0004-per-icon-color-classification.md)). @neodx/svg flattens multicolor icons by default.
2. **Works in Next.js 16 with Turbopack and Server Components** out of the box, with no client-side injection. Gradients and masks render during SSR.
3. **Deterministic output**, including Unicode-normalized names, safe to commit and diff in CI, with a `check` mode.
4. **A CLI UX that reports what it did**: stats, `--json`, stable exit codes.

Table stakes, needed but not the pitch: an external hashed sprite with a manifest, generated types, and no bundler requirement. Multiple sprites are table stakes too; svgworm adds them post-v0.1 (TSK-021).

## Non-goals (for v1)

- Fetching icon sets from remote sources (Iconify etc.)
- Raster output (PNG) or icon fonts
- Visual editing of icons
- Framework adapter packages other than `@svgworm/react` (Astro is covered by a generated `Icon.astro`, [ADR-0017](adr/0017-astro-support-via-generated-icon-astro.md); further adapters come after the core contract is stable)
- Runtime icon loading by name from a server
