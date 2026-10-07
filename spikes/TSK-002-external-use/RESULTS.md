# TSK-002 spike: external `<use>` browser compatibility

_Date: 2026-10-08. Throwaway prototype, evidence only. `svgo`, `playwright` and `pngjs` are spike tools here, not product choices. `src/color.mjs` is a copy of the TSK-003 classifier and rewrite, so the ADR-0004 mono rewrite runs exactly as it was evaluated._

## Question

Do the committed fixtures render correctly through an **external** `<use href="sprite.svg#id">` in current Chromium, Firefox, and WebKit? Does the ADR-0004 mono rewrite hold in real browsers? Does `<style>` leak between symbols? Is `viewBox` on `<symbol>` enough? What happens cross-origin and without a `viewBox`?

## Method

```sh
pnpm install
npx playwright install chromium firefox webkit
pnpm build   # out/sprite.svg, probes.svg, variants.svg, stack.svg, external.html, inline.html
pnpm check   # renders in the 3 engines, writes results/
```

**Build (`src/build.mjs`):** every valid fixture (24 icons, `invalid/` excluded) is classified, mono icons get the ADR-0004 rewrite (`toCurrentColor`), the others only get `<style>` inlined. Internal ids are prefixed per icon (`svgo` `prefixIds`), and the root becomes a `<symbol id viewBox>`. Root presentation attributes such as `fill` move to the symbol. Symbols are sorted by id. Three hand-written files cover what the fixtures can't:
- `probes.svg`: raw `<style>` (does it apply, does it leak between two symbols that both style `.st0`?) and a symbol with no `viewBox`.
- `variants.svg`: minimal gradient, clipPath, mask, mask-with-`<use>`, and filter symbols. Each one is defined both inside the `<symbol>` and in a `<defs>` at the sprite root. Success is solid green, and for clip and mask only the left half.
- `stack.svg`: the same icons as an "SVG stack" (nested `<svg id>` shown only when it is the URL `:target`). It is used as `<img src="stack.svg#id">` and as a CSS `mask` with `background: currentColor`.

**Check (`src/check.mjs`):** a Node static server (with `Access-Control-Allow-Origin: *` on every response) serves the pages. Playwright 1.58.2 opens them in **Chromium 145.0.7632.6, Firefox 146.0.1, and WebKit 26.0** at device scale 2. Each cell is compared with the **original fixture rendered as `<img>` by the same engine**:
- Firefox can't take transparent element screenshots, so every page is captured twice, on white and on black. Straight alpha and color are recovered per pixel (`α = 1 − (white − black)`, `color = black / α`). Cells sit on an integer pixel grid so the crops line up.
- **Shape:** fails if more than 1% of pixels differ in coverage by more than 64.
- **Color (multicolor):** fails if more than 1% of pixels opaque in both differ by more than 40 on any channel.
- **Mono rewrite:** the cell is rendered with `color: #ff0000` and passes when the shape matches and at least 99% of opaque pixels are red. Multicolor icons in that column must stay identical to the original.
- **Probes:** expected color, or bounding box for the `viewBox` probes.

Two consecutive runs produced an identical matrix.

## Results

Full matrix: [`results/matrix.md`](results/matrix.md) (raw: `results/matrix.json`). Screenshots: `results/<engine>-external.png`, `results/<engine>-inline.png`. Summary of external `<use>`:

| Feature (fixture) | Chromium | Firefox | WebKit |
|---|---|---|---|
| Mono fill: currentColor, implicit black, opacity, Figma export (4) | pass | pass | pass |
| Stroke: lucide, tabler, Figma export (3) | pass | pass | pass |
| Fill + stroke, mono and multicolor (2) | pass | pass | pass |
| Flat multicolor, 4:3 flag (2) | pass | pass | pass |
| **ADR-0004 mono rewrite follows `color`** (16 mono icons) | 16/16 | 16/16 | 15/16 (knockout: the mask fails, not the recolor) |
| Multicolor unaffected by `color` (8) | 8/8 | 7/8 (nextjs, see below) | 4/8 (the reference rows below) |
| `<style>` inlined at build (2) | pass | pass | pass |
| Nested `<svg>`, internal `<use href="#">` (3) | pass | pass | pass |
| Non-ASCII ids in the fragment (`café`, `日本`) | pass | pass | pass |
| linearGradient (kotlin) | pass | pass | **blank** |
| Gradient with transparent stops (scaledrone) | pass | pass | **gradient circle missing** |
| Mask on mono shape (knockout) | pass | pass | **mask ignored (solid square)** |
| Mask built with `<use>` (nextjs) | pass | **blank** | **mask and gradients ignored** |
| clipPath (fixtures only clip to the full box) | pass | pass | pass (no-op clip) |
| Filter drop shadow (grove) | pass | pass | **filtered ring missing** |
| Consumer `<svg>` without `viewBox` (width/height attrs, or CSS-sized) | pass | pass | pass |
| Cross-origin sprite, even with `Access-Control-Allow-Origin: *` | **blocked** | **blocked** | **blocked** |

Minimal variants (`variants.svg`) isolate the WebKit and Firefox failures:

| Variant | Chromium | Firefox | WebKit |
|---|---|---|---|
| Gradient, in symbol / root `<defs>` | pass / pass | pass / pass | **blank / blank** |
| clipPath (real half clip), in symbol / root | pass / pass | pass / pass | **not clipped / not clipped** |
| Mask, in symbol / root | pass / pass | pass / pass | **not masked / not masked** |
| Mask containing `<use>`, in symbol / root | pass / pass | **blank** / pass | **not masked / not masked** |
| Filter, in symbol / root | pass / pass | pass / pass | **blank / blank** |

**WebKit resolves no `url(#…)` reference inside an externally referenced sprite**, wherever the referenced element is. Moving defs to the sprite root does not help. The same icons render correctly in WebKit from an inline sprite and as `<img>`, so the failure is specific to external `<use>`. WebKit bug [105904](https://bugs.webkit.org/show_bug.cgi?id=105904) ("SVG external use doesn't work with animation, gradients, filters", 2013) describes the same class of failure and was closed without a fix. Firefox fails only for a mask whose content is a `<use>`, when the mask is inside the symbol.

**SVG stack alternative:** `<img src="stack.svg#id">` matched the original for **24/24 icons in all three engines**, gradients, masks and filters included. For the 16 mono icons, the stack used as a CSS `mask` with `background: currentColor` rendered the exact shape fully in the theme color in all three engines, knockout mask included.

### `<style>` (Q-04)

| Probe | Chromium | Firefox | WebKit |
|---|---|---|---|
| Raw `<style>` in external sprite applies to its own symbol | yes (green) | **no** (black) | **no** (black) |
| Two symbols both styling `.st0` (A red, B blue) | **leaks**: A renders blue | ignored: both black | ignored: both black |
| Inline sprite: same A/B probe | **leaks** (A blue) | **leaks** (A blue) | **leaks** (A blue) |
| Inline sprite: page element with `class="st0"` outside the sprite | **leaks** (blue) | **leaks** (blue) | **leaks** (blue) |

A raw `<style>` in an external sprite is both leaky (Chromium applies it document-wide) and non-portable (Firefox and WebKit ignore it). The inline-sprite case leaks into the whole page in every engine. Inlining every rule at build time (ADR-0004) is required, and it is sufficient: both inlined fixtures pass everywhere.

### `viewBox` (Q-03, Q-06)

- `viewBox` on `<symbol>` is enough. A consumer `<svg>` without `viewBox`, sized by `width`/`height` attributes or by CSS only, matched the original in all three engines, the 4:3 flag included (letterboxed like the `<img>`).
- A symbol without `viewBox` is not scaled. `invalid/no-viewbox.svg` (24×24, square from 4 to 20) drawn in a 48 px box covers CSS px 4–20 in every engine (`bbox 8,8-40,40` at 2x). With `viewBox="0 0 24 24"` derived from `width`/`height` it covers 8–40 (`16,16-80,80`), like the original scaled.

### Cross-origin (Q-02)

Page on `http://localhost:4302`, sprite on `http://127.0.0.1:4302` with a permissive CORS header. All 24 cells blank in all three engines:
- Chromium: `Unsafe attempt to load URL http://127.0.0.1:4302/sprite.svg from frame with URL http://localhost:4302/external.html. Domains, protocols and ports must match.`
- Firefox: `Security Error: Content at http://localhost:4302/external.html may not load data from http://127.0.0.1:4302/sprite.svg.` (no request is made)
- WebKit: `Unsafe attempt to load URL http://127.0.0.1:4302/sprite.svg from origin http://localhost:4302. Domains, protocols and ports must match.` (no request is made)

No workaround was prototyped (TSK-014 scope cut).

### Inline sprite (informative, post-v0.1 per ADR-0005)

All 24 icons pass in Chromium and Firefox. WebKit differs by 1.52% on the filter icon (drop-shadow edge). Inline sprites leak `<style>` into the page, as shown above.

## Not covered

- **Real Safari and iOS.** Playwright's WebKit build is close to Safari but not the same binary. The fallback rule chosen in ADR-0006 is correct in every engine tested, so if real Safari turns out to support references, the cost is only that some icons use the fallback when they don't need it.
- Patterns and markers (no fixture). `<text>`, animations.
- Performance of many `<img src="stack.svg#…">` on one page. Each fragment is the same HTTP resource, but decode and memory cost per fragment were not measured.
- Cross-origin behavior of the stack as `<img>` (normally allowed) and as CSS `mask` (a CORS fetch per the CSS Masking spec). Not tested.
- High-contrast and forced-colors modes.
