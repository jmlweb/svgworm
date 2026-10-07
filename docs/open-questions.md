# Open questions

Each question maps to a backlog task. When an ADR resolves one, mark it ✅ with a link.

## Rendering and browsers

- **Q-01** Do gradients, masks, clipPath, filters, and `<style>` inside `<symbol>` render correctly through an **external** `<use href="file.svg#id">` in current Chromium, Firefox, and WebKit? If not, which features need a fallback?
- **Q-02** Cross-origin sprites (assets on a CDN domain): which workaround should we recommend? Same-origin proxy, inline fallback, or fetch-and-inject (which costs JS)?
- **Q-03** Is `viewBox` on `<symbol>` enough for sizing in all browsers, or does the consumer `<svg>` also need it?

## Color

- **Q-10** Which heuristic classifies an icon as mono, stroke, or multicolor reliably?
- **Q-11** How should `currentColor` be applied: on the root, or rewritten on each element? What about icons that mix fill and stroke?
- **Q-12** Should a CSS custom-property mode (`--icon-color-1`, …) exist for multicolor theming?

## Delivery and integration

- **Q-20** How does the hashed sprite URL reach the app without a bundler plugin? (generated module with constants, base-path config)
- **Q-21** How do Next.js App Router, Vite, Astro, and plain HTML each serve the output dir? Should we document recipes, add adapter helpers, or both?
- **Q-22** Should sprites be split by namespace, by explicit config groups, or both? Is there a default size limit?
- **Q-23** Should the sprite be preloaded (`<link rel="preload">`)? Is that a recommendation, or does an adapter helper emit it?

## Types and naming

- **Q-30** Type-checking performance with 5,000+ names: union, `as const` array, or a template-literal approach?
- **Q-31** Namespace separator and normalization rules (see output-contract)
- **Q-32** Collision policy: always error, or allow an alias map?

## Tooling (decided only through ADRs after the spikes)

- **Q-40** Runtime and build tool, test runner, SVG parser and optimizer, CLI framework, config format
- **Q-41** Monorepo (core + adapters as separate packages) vs a single package with subpath exports
- **Q-42** Watch mode implementation and incremental cache

## Product

- **Q-50** Exact differentiators vs current competitor versions (competitor deep-dive)
- **Q-51** License (MIT?) and contribution policy
