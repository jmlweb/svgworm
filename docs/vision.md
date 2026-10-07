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
- Framework-agnostic consumers (plain HTML, Vue, Svelte) through the core output. Adapters come later.

## Positioning

"Zero-JS, type-safe SVG sprites. Framework-agnostic CLI, deterministic output, React Server Components first."

Planned differentiators (to be validated, see [viability.md](viability.md)):

1. External hashed sprite with a manifest by default. Inline is opt-in.
2. Deterministic ids and types, safe to commit and diff in CI.
3. Per-icon color strategy: mono icons become `currentColor`, multicolor icons are preserved, and stroke icons are handled correctly.
4. Multiple sprites (namespaces or chunks), so a page doesn't download a giant sprite.
5. `check` mode for CI that fails when the generated output is stale.
6. Bundler-independent: plain CLI first, plugins later if needed.

## Non-goals (for v1)

- Fetching icon sets from remote sources (Iconify etc.)
- Raster output (PNG) or icon fonts
- Visual editing of icons
- Adapters other than React (they come after the core contract is stable)
- Runtime icon loading by name from a server
