# Viability analysis

_Date: 2026-10-07. Based on the `main` prototype (last commit Jan 2025) and a review of the ecosystem._

## Verdict

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
| SVGR | Component per icon | JS cost, no sprite, no caching |
| vite-plugin-icons-spritesheet | Vite plugin: sprite + types | Tied to Vite; one sprite; color handling |
| svg-icons-cli (Epic Stack lineage) | CLI: sprite + typed component | React-specific; limited color and multi-sprite support |
| svg-sprite / svgstore | Generic sprite builders | No types, no framework integration |
| unplugin-icons / Iconify | Icon sets as components | Remote sets, component per icon |

**Action:** the competitor deep-dive task checks this table against current versions before we finalize positioning.

## Go / no-go criteria for v1

- [ ] Spike shows external sprites render gradients, masks, and clipPath correctly in current Chromium, Firefox, and WebKit, or we document a fallback (inline those icons only).
- [ ] The URL delivery approach works in at least plain HTML, Next.js App Router, and Vite without a bundler plugin.
- [ ] Color classification is correct on ≥95% of the fixture corpus, with an override for each icon.
- [ ] Type-checking stays fast with 5,000 icon names.
