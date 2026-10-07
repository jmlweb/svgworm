# Open questions

Each question maps to a backlog task. When an ADR resolves one, mark it ✅ with a link.

## Rendering and browsers

- **Q-01** Do gradients, masks, clipPath, filters, and `<style>` inside `<symbol>` render correctly through an **external** `<use href="file.svg#id">` in current Chromium, Firefox, and WebKit? If not, which features need a fallback? → TSK-002
- **Q-02** Cross-origin sprites (assets on a CDN domain): which workaround should we recommend? Same-origin proxy, inline fallback, or fetch-and-inject (which costs JS)? → TSK-002
- **Q-03** Is `viewBox` on `<symbol>` enough for sizing in all browsers, or does the consumer `<svg>` also need it? → TSK-002
- **Q-04** How are `<style>` blocks kept from leaking between icons in a shared sprite (and into the page when inline)? Inline to attributes, prefix class names, reject what can't be scoped? → TSK-002, TSK-003. Partly answered by [ADR-0004](adr/0004-per-icon-color-classification.md): inline every rule, error on any `<style>` left over (all 929 corpus cases inlined). Inline-sprite leakage still open (TSK-002) Inline-sprite part deferred to post-v0.1 (ADR-0005).
- **Q-05** If some icons must be inlined as a fallback (Q-01), how does the manifest tell adapters which delivery each icon uses? → TSK-002, TSK-008 Deferred to post-v0.1 with inline fallback (ADR-0005).
- **Q-06** Icon without a `viewBox`: error, or derive one from `width`/`height`? (R-23) → TSK-002

## Color

- ✅ **Q-10** Which heuristic classifies an icon as mono, stroke, or multicolor reliably? → TSK-003. Answered by [ADR-0004](adr/0004-per-icon-color-classification.md): two classes, mono and multicolor, 99.98% on 31k icons
- ✅ **Q-11** How should `currentColor` be applied: on the root, or rewritten on each element? What about icons that mix fill and stroke? → TSK-003. Answered by [ADR-0004](adr/0004-per-icon-color-classification.md): per element, root only for the default fill, masks frozen
- **Q-12** Should a CSS custom-property mode (`--icon-color-1`, …) exist for multicolor theming? → Deferred past v1 by [ADR-0004](adr/0004-per-icon-color-classification.md) Deferred to post-v0.1 (ADR-0005).

## Delivery and integration

- **Q-20** How does the hashed sprite URL reach the app without a bundler plugin? (generated module with constants, base-path config) → TSK-004
- **Q-21** How do Next.js App Router, Vite, Astro, and plain HTML each serve the output dir? Should we document recipes, add adapter helpers, or both? → TSK-004 Next.js and plain HTML in v0.1; Vite and Astro deferred to post-v0.1 (ADR-0005).
- **Q-22** Should sprites be split by namespace, by explicit config groups, or both? Is there a default size limit? → TSK-008 Deferred to post-v0.1 (ADR-0005).
- **Q-23** Should the sprite be preloaded (`<link rel="preload">`)? Is that a recommendation, or does an adapter helper emit it? → TSK-004 Deferred to post-v0.1 (ADR-0005).
- **Q-24** Sprite file naming scheme and content-hash length → TSK-004
- **Q-25** Inline sprite output form: raw SVG string, framework component, or both? → TSK-004 Deferred to post-v0.1 (ADR-0005).

## Types and naming

- **Q-30** Type-checking performance with 5,000+ names: union, `as const` array, or a template-literal approach? → TSK-005 Deferred to post-v0.1 (ADR-0005); v0.1 uses a plain union.
- **Q-31** Namespace separator and normalization rules (see output-contract) → TSK-006
- **Q-32** Collision policy: always error, or allow an alias map? → TSK-006 Collisions are always an error in v0.1; alias map deferred to post-v0.1 (ADR-0005).

## Tooling (decided only through ADRs after the spikes)

- ✅ **Q-40** Runtime and build tool, test runner, SVG parser and optimizer, CLI framework, config format → TSK-009. Answered by [ADR-0008](adr/0008-tech-stack-and-package-layout.md): Node `^22.20 || >=24.11`, TypeScript 6, `tsc`, Vitest 5, svgo 4, `node:util.parseArgs` + @clack/prompts, `svgworm.config.json` validated with zod
- ✅ **Q-41** Monorepo (core + adapters as separate packages) vs a single package with subpath exports → TSK-009. Answered by [ADR-0008](adr/0008-tech-stack-and-package-layout.md): pnpm workspace with `svgworm` (core + CLI) and a zero-dependency `@svgworm/react`
- ✅ **Q-42** Watch mode implementation and incremental cache → TSK-009 Incremental watch deferred to post-v0.1 (ADR-0005); v0.1 rebuilds everything on change. v0.1 part answered by [ADR-0008](adr/0008-tech-stack-and-package-layout.md): recursive `fs.watch` with a debounced full rebuild; the incremental cache (keyed by content hash) is TSK-023

## Product

- ✅ **Q-50** Exact differentiators vs current competitor versions (competitor deep-dive) → TSK-007. Resolved by [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md)
- **Q-51** License (MIT?) and contribution policy → TSK-009. Proposed in [ADR-0009](adr/0009-license-versioning-and-release.md): MIT, inbound = outbound with no CLA. Pending the maintainer's confirmation
