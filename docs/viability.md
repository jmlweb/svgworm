# Viability analysis

_Date: 2026-10-07. Based on the `main` prototype (last commit Jan 2025) and a review of the ecosystem._

## Verdict

> **Update 2026-10-08:** after the TSK-007 and TSK-003 spikes, [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md) decides to build. The positioning is narrower: zero-config correctness for Next.js App Router and Server Components. Adoption is the main risk, so there are kill criteria at 12 weeks after v0.1.0.

**Viable.** The technical risk is low: SVG sprites with `<use>` are a mature, well-supported technique. The **main risk is product differentiation** in a crowded space. The project is worth continuing if it commits to the differentiators below and validates the browser edge cases early.

## Technical feasibility

| Area | Risk | Notes |
|------|------|-------|
| Sprite generation (`<symbol>` + `<use>`) | Low | Standard technique, supported by all modern browsers |
| SVG optimization | Low | Mature optimizers exist (the prototype used svgo) |
| Type generation | Low | A string-literal union or `as const` array. TS performance at very large counts needs checking |
| React Server Components | Low | A hook-free component that renders `<svg><use/></svg>` is RSC-safe by construction |
| External sprite + gradients/masks/clipPath/filters | **Medium** | Historic browser quirks with paint servers referenced inside external `<use>`. **Spike required** |
| Cross-origin sprites (CDN on another domain) | **Medium** | `<use href>` to another origin is blocked. We need a documented constraint or a workaround |
| Getting the hashed sprite URL into apps | **Medium** | Each framework or bundler serves static assets differently. Needs a framework-agnostic manifest plus guidance |
| Color classification per icon | Medium | Heuristics for mono, stroke, and multicolor. Needs a fixture corpus |
| Determinism | Low | A matter of discipline: sorting and content hashing |

## Lessons from the `main` prototype

What worked and is worth porting as *ideas*:

- svgo pipeline with `prefixIds` to keep internal ids unique per icon
- Content-hash file names, and cleaning up stale sprites by glob
- Caching optimized icons by content hash
- Validated config merging (CLI flags, config file, interactive prompts)

What was wrong:

1. **File mode was disconnected.** It wrote `sprite.<hash>.svg`, but the generated `Icon` referenced `#id`, which only works with an inline sprite. Nothing told the app the hashed URL. **We need a manifest.**
2. **The inline (component) sprite was the only working path.** It puts every icon in every SSR response.
3. **Global `fill="currentColor"`** on the root breaks stroke-only icons. A single `--color` flag can't handle a mixed icon set.
4. **Order-dependent ids.** The duplicate-name counter (`name-2`) depended on crawl order, so types could change between machines.
5. **A string replace turned `<svg` into `<symbol`.** It only replaced the first match and broke nested `<svg>`. We need an AST transform.
6. **The prefix was not sanitized** before being used in identifiers (`my-app` became `My-appIcon`).
7. **The CLI and generation logic were coupled.** There was no programmatic API.
8. **Fixtures** look proprietary (Flaticon/Freepik), so they can't be published.

## Competitive landscape

| Tool | Approach | Gap svgworm targets |
|------|----------|---------------------|
| [@neodx/svg](https://neodx.pages.dev/svg/) (1.1.1, Aug 2026) | CLI + Node API + unplugin: multi-sprite, hashed files, typed metadata | **Closest competitor**, see below. Manual color rules; no shipped adapter; RSC and determinism undocumented |
| [vite-plugin-svg-spritemap](https://github.com/g-makarov/vite-plugin-svg-spritemap) (2.0.1, Aug 2026) | Vite plugin: sprite + optional name union, hoists and namespaces defs | Tied to Vite; no per-icon color; no framework-agnostic manifest |
| [vite-plugin-icons-spritesheet](https://github.com/forge42dev/vite-plugin-icons-spritesheet) (3.1.0, Jun 2026) | Vite plugin: sprite + types, rebuilds on change | Tied to Vite; one sprite; color handling |
| [svg-icons-cli](https://github.com/alexanderson1993/svg-icons-cli) (0.0.8, Mar 2024) | CLI: sprite + typed component (Epic Stack lineage) | React + Tailwind specific; limited color and multi-sprite support; inactive |
| [react-icons-svg-sprite](https://github.com/xanderberkein/react-icons-svg-sprite) (0.0.8, Sep 2023) | CLI: pick react-icons into a sprite + types | React-only, curated sets not your own folder; inactive |
| [react-svg-sprite-generator](https://github.com/simprl/react-svg-sprite-generator) (1.0.38, Apr 2024) | CLI: folder to sprite + names file with base64 previews | React-only; no color handling; inactive |
| [vite-plugin-svgs-icons](https://github.com/335296558/vite-plugin-svgs-icons) (1.0.10, Jun 2024) | Vite plugin: sprite with color/multicolor props | Tied to Vite; README warns not all SVGs are supported; inactive |
| [SVGR](https://github.com/gregberge/svgr) (`@svgr/core` 8.1.0, Aug 2023, 21.6M/week) | Component per icon | JS cost, no sprite, no caching |
| [svg-sprite](https://github.com/svg-sprite/svg-sprite) (2.0.4, Feb 2025, 237k/week) / [svgstore](https://github.com/svgstore/svgstore) (3.0.1, Jun 2022, 99k/week) | Generic sprite builders | No types, no framework integration |
| [unplugin-icons](https://github.com/unplugin/unplugin-icons) (24.0.0, Sep 2026, 841k/week) / Iconify | Icon sets as components | Remote sets, component per icon |

Versions, dates, and weekly downloads come from npm on 2026-10-08.

### @neodx/svg in detail

Checked on 2026-10-08 against the [docs](https://neodx.pages.dev/svg/) and npm. MIT, about 94 GitHub stars, active (1.0 in Aug 2026, 1.1.1 on 2026-08-25). It already covers most of what we planned:

- **Delivery:** Node API (`createSvgSpriteBuilder`) and unplugin builds for Vite, webpack, Rollup, esbuild, and Rspack. The `sprite` CLI is deprecated and has no hash option. **Verified:** the documented Next.js setup (webpack plugin) fails on Next 16, where Turbopack is the default. Only a Node API prebuild script works there.
- **Multiple sprites:** one sprite per directory by default (`group: true`), or a custom grouping function.
- **Hashing:** content-based `{hash}` / `{hash:N}` in the `fileName` template. Stale sprites are cleaned up automatically.
- **Manifest and types:** a generated TS module (`sprite.gen.ts`) with `defineSpriteMap` and a `SpritesMeta` interface (sprite name to a union of icon names). At runtime, `sprites.experimental_get(sprite, icon, { baseUrl })` returns the hashed `href` and `viewBox`. This solves the "hashed URL into apps" problem, but through a TS module and an experimental runtime helper, not a framework-agnostic JSON manifest.
- **Color:** `resetColors` is **on by default** and turns every color into `currentColor`. Rules can be scoped by file path (`include`/`exclude`) and support `keep`, `replace` (including CSS variables), and `replaceUnknown`. Multicolor icons rely on manually listing colors and mapping the rest to a CSS variable. This is **path-based configuration, not automatic per-icon classification**. With default settings, a multicolor icon gets flattened silently.
- **Internal references:** `inline.filter: 'auto'` moves symbols with internal references (gradients, masks) to an `inject` asset. **Verified:** under SSR these icons render blank, because the injector returns early when `window` is undefined. A hand-written server-side workaround fixes it. The mask's `#fff` was also rewritten to `currentColor`, so mask opacity depends on text color.
- **Component:** none ships ("We don't provide a pre-made, ready-to-use component"). **Verified:** both the docs' component and a hook-free one work as Server Components with zero client JS.
- **Optimization:** svgo 3.
- **Determinism:** not documented. **Verified:** stable across reruns and absolute paths. NFC and NFD file names give different ids and hashes, and the generated type doesn't match the name a developer types.
- **Footprint:** 16 build-time dependencies (svgo, colord, fast-xml-parser, zod, commander, chokidar, unplugin, and its own `@neodx/*` packages). **Verified:** no runtime import; helpers are inlined into the generated `sprite.gen.ts` (~300 lines).

**What is still left for svgworm** (after the [hands-on spike](../spikes/TSK-007-neodx-next/RESULTS.md)): correct output with zero config. That covers automatic per-icon color that never silently flattens multicolor icons, gradients and masks that render during SSR, Unicode-normalized names, and a working Next.js + Turbopack path that needs no glue code. A JSON manifest, a CLI UX with stats and `--json`, and a CI `check` mode are secondary. Sprites, types, and hashing are table stakes. Decision: build, per [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md).



## Go / no-go criteria for v1

- [x] Spike shows external sprites render gradients, masks, and clipPath correctly in current Chromium, Firefox, and WebKit, or we document a fallback (inline those icons only). They don't in WebKit. The fallback is a zero-JS SVG-stack file (`<img>`, or a CSS mask for mono), not inline. See [ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md).
- [ ] The URL delivery approach works in at least plain HTML, Next.js App Router, and Vite without a bundler plugin.
- [x] Color classification is correct on ≥95% of the fixture corpus, with an override for each icon. 99.98% on 31,390 icons, see [ADR-0004](adr/0004-per-icon-color-classification.md).
- [ ] Type-checking stays fast with 5,000 icon names. Deferred past v0.1 by [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md); v0.1 uses a plain union.
