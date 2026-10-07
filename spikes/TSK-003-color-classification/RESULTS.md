# TSK-003 spike: per-icon color classification

_Date: 2026-10-08. Throwaway prototype, evidence only. `svgo` and `@resvg/resvg-js` are spike tools here, not a parser or renderer choice for the product (that is TSK-009)._

## Question

Can a static analysis of an SVG decide, per icon, whether it is **mono** (one visible color, safe to turn into `currentColor`) or **multicolor** (must be preserved)? And can the mono rewrite be done without changing how the icon looks?

## Method

**Corpus** (31,390 icons, built by `src/build-corpus.mjs` from pinned npm tarballs, not committed):

| Group | Sets | Icons |
|-------|------|-------|
| `currentColor` libraries | lucide 1.52.0 (ISC), heroicons 2.2.0 (MIT), tabler 3.49.0 (MIT), phosphor 2.1.1 (MIT), simple-icons 16.34.0 (CC0, implicit black) | 17,340 |
| Hardcoded colors | devicon 2.17.0 (MIT), flag-icons 7.5.0 (MIT), Iconify JSON: noto 1.2.9 (Apache-2.0), logos 1.2.15 (CC0), fluent-emoji-flat 1.2.6 (MIT), flat-color-icons 1.2.3 (MIT) | 11,621 |
| Synthetic exports | Figma-style (hardcoded `#1E1E1E`, clip group with a white `<rect>`), Illustrator-style (`<style>` classes) | 2,429 |

49 noto icons are excluded because resvg 2.6.2 aborts on them with a Rust panic (`resvg-panics.txt`).

**Ground truth by rendering** (`src/evaluate.mjs`): each original icon is rendered at 96 px with a magenta inherited `color`. Pixels with alpha ≥ 64 are unpremultiplied and compared with the dominant color. The icon is mono when at most 0.2% of them differ by more than 12 per channel.

**Rewrite check:** every icon both sides call mono is rewritten and rendered with `color="#ff0000"`. It passes when the alpha channel matches the original and every visible pixel is red. Negative control: a neodx-style mask rewrite (`#fff` → `currentColor`) changes the rendered coverage from 2,029,875 to 437,829 and would be flagged.

## Classifier (`src/color.mjs`)

1. Inline `<style>` rules and `style=""` declarations into presentation attributes.
2. Walk only what renders: skip `defs`, `clipPath`, `mask`, `symbol`, `marker`, `pattern`, and `display="none"`. Follow `<use>`, gradients (including `href` chains), and filters.
3. For each shape, resolve the effective `fill` and `stroke` with inheritance. The SVG default fill (black) counts. Skip `none`, `transparent`, zero opacity, and zero stroke width.
4. Gradient stops all count, transparent ones included, unless every stop is transparent. A transparent stop still tints the interpolation.
5. `<image>`, `<foreignObject>`, `feImage`, and patterns force multicolor.
6. Merge literal colors within 8 per channel (an export artifact, like `#000000` vs `#010101`). Then 1 color (or only `currentColor`) is mono; anything more is multicolor.

**Rewrite for mono:** replace each effective paint value on the element that declares it (not on the root). Set `fill="currentColor"` on the root only when an icon relies on the default black fill. First freeze the inherited fill on any `<mask>`, so mask luminance does not follow the theme. Leave `clipPath` content alone and drop `color` attributes.

## Results

| Metric | Result |
|--------|--------|
| Classification agreement, all 31,390 icons | **99.98%** |
| Agreement on the 14,050 hardcoded-color and synthetic icons | **99.96%** |
| Dangerous errors (called mono, actually multicolor, would be recolored) | **0** |
| Safe errors (called multicolor, renders mono, kept as is) | 5 |
| Mono rewrites that render identically in the new color | **100%** (21,667 / 21,667) |
| Runtime, classify + 3 renders per icon | ~32 s for the whole corpus |

The 5 safe errors are colors hidden under other shapes (d3js, uwsgi) or details below the oracle's 0.2% share (flag `xx`, gulp's white). A static analysis can't see occlusion. Keeping those icons multicolor is the safe outcome.

**Sensitivity** (classifier tolerance 8):

| Oracle threshold | Agreement | Dangerous | Safe |
|------------------|-----------|-----------|------|
| 6 | 99.98% | 5 | 2 |
| **12** | **99.98%** | **0** | **5** |
| 24 | 99.93% | 0 | 22 |
| 40 | 99.15% | 0 | 267 |

The 5 "dangerous" icons at threshold 6 are colors 7–8 apart, which the classifier merges on purpose. Once the oracle's threshold is at least the classifier's tolerance, there are no dangerous errors.

**Bugs found and fixed during the spike:**
- Skipping transparent gradient stops made `logos/scaledrone` look mono.
- Iconify bodies need `xmlns:xlink` declared.

## `<style>` (Q-04)

All 929 corpus icons with a `<style>` block were fully inlined. Rules that can't be inlined (`@media`, `:hover`, animations) stay in the `<style>`, while the class they target is removed, so they silently stop working and could leak into the sprite. Any `<style>` left after inlining should be an error.

## Not covered

- Markers (`marker-start` and similar) are skipped, and their colors are not counted. No corpus icon used them. Treat as multicolor or error.
- CSS variables inside icons (`fill="var(--x)"`) are counted as an opaque literal.
- SMIL or CSS animations of color.
- Text: resvg runs without system fonts, so text colors aren't verified.
- Oracle is resvg. Browser parity of the rewrite is not checked; that belongs to the browser rendering spike (TSK-002).
