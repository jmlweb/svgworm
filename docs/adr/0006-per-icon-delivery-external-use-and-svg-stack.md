# 0006. Per-icon delivery: external `<use>` by default, SVG-stack image for icons with `url(#…)` references

- **Status:** accepted; point 5 (Q-03), "the same `viewBox` on the consumer `<svg>` … is harmless", is superseded by [0030](0030-consumer-viewbox-keeps-only-the-size.md)
- **Date:** 2026-10-08
- **Task:** TSK-002
- **Resolves:** Q-01, Q-03, Q-04 (browser side), Q-06. Informs Q-02 (constraint only) and Q-05. Accepts [ADR-0001](0001-external-sprite-default.md).

## Context

[ADR-0001](0001-external-sprite-default.md) made an external hashed sprite (`<use href="sprite.svg#id">`) the default delivery, pending browser evidence. [ADR-0004](0004-per-icon-color-classification.md) verified its mono rewrite only with resvg. [ADR-0005](0005-build-standalone-with-kill-criteria.md) positions svgworm on "gradients and masks that render" with zero config, and defers inline delivery and Q-05 to post-v0.1.

The [TSK-002 spike](../../spikes/TSK-002-external-use/RESULTS.md) rendered all 24 valid fixtures plus minimal probes in Chromium 145, Firefox 146, and WebKit 26 (Playwright 1.58.2). Each render was compared pixel by pixel with the original icon drawn by the same engine. Feature × browser matrix for external `<use>`:

| Feature | Chromium | Firefox | WebKit |
|---|---|---|---|
| Mono fill, stroke, fill + stroke, flat multicolor, non-square `viewBox` | ✅ | ✅ | ✅ |
| ADR-0004 mono rewrite follows `color` (16 mono icons) | ✅ 16/16 | ✅ 16/16 | ✅ 15/16 (knockout fails because of its mask, not the recolor) |
| `<style>` inlined at build time | ✅ | ✅ | ✅ |
| Nested `<svg>`, internal `<use href="#">`, non-ASCII ids | ✅ | ✅ | ✅ |
| Gradient (`fill="url(#…)"`) | ✅ | ✅ | ❌ blank |
| clipPath | ✅ | ✅ | ❌ not clipped |
| Mask | ✅ | ✅ | ❌ not masked |
| Mask whose content is a `<use>` | ✅ | ❌ blank (when inside the symbol) | ❌ not masked |
| Filter | ✅ | ✅ | ❌ element not drawn |
| Raw `<style>` inside the sprite | ⚠️ applies, leaks across symbols | ignored | ignored |
| `viewBox` only on `<symbol>` (consumer `<svg>` without one) | ✅ | ✅ | ✅ |
| `<symbol>` without `viewBox` | not scaled | not scaled | not scaled |
| Cross-origin sprite, even with `Access-Control-Allow-Origin: *` | ❌ blocked | ❌ blocked | ❌ blocked |
| Same icons as `<img src="stack.svg#id">` (SVG stack) | ✅ 24/24 | ✅ 24/24 | ✅ 24/24 |
| Mono icons as CSS `mask: url(stack.svg#id)` + `background: currentColor` | ✅ 16/16 | ✅ 16/16 | ✅ 16/16 |

The key fact: **WebKit resolves no `url(#…)` reference inside an externally referenced sprite.** That covers gradients, clipPath, masks, and filters, whether they are defined inside the symbol or at the sprite root. The same icons render in WebKit when inline or as `<img>`. WebKit is Safari and every iOS browser, so "it works in Chromium" is not enough.

## Options considered

1. **External `<use>` for every icon (ADR-0001 as written).** Simplest. It breaks 5 of 24 fixtures in WebKit and 1 in Firefox, exactly the gradient and mask icons that ADR-0005 promises render. Rejected.
2. **Restructure the sprite (move defs to a root `<defs>`).** Tested in the variants. It fixes the Firefox mask-with-`<use>` case, but nothing in WebKit. Rejected.
3. **Per-icon inline fallback** (the fallback ADR-0001 anticipated). It renders everywhere (inline column of the spike). But it needs inline delivery in v0.1, which ADR-0005 defers. It also adds the icon to every SSR response and needs page-level sprite injection. Inline `<style>` leaks into the page in all three engines, though inlined attributes avoid that. Rejected for v0.1.
4. **Fetch-and-inject with JavaScript.** Violates zero-JS (principle 1). Rejected.
5. **Per-icon delivery from a second external file, an "SVG stack".** Icons that need references go into `stack.svg`: nested `<svg id>` elements shown only when they are the URL `:target`. Multicolor icons render as `<img src="stack.svg#id">`, mono icons as a CSS mask filled with `currentColor`. It is zero-JS, cacheable, and renders 24/24 in all three engines. Cons:
   - a second file and a manifest field;
   - `<img>` can't inherit `currentColor` (multicolor icons don't need it);
   - the mask form only carries a silhouette (mono icons have one color by definition).

   Chosen.

## Decision

1. **The external hashed sprite stays the default, and ADR-0001 is accepted.** An icon is delivered as `<svg><use href="{sprite}#{id}"/></svg>` unless rule 2 applies.
2. **An icon is "reference-dependent"** when its processed, rendered content uses any `url(#…)` reference: paint servers in `fill`/`stroke`, `clip-path`, `mask`, `filter`, `marker-*`. Internal `<use href="#…">` alone does not count (it passes everywhere). Reference-dependent icons go into a second content-hashed file, the **stack**, and get a per-icon delivery:
   - **multicolor** → `img`: `<img src="{stack}#{id}" width height alt="…">`;
   - **mono** → `mask`: an element with `mask: url("{stack}#{id}") center / contain no-repeat` and `background-color: currentColor`, so ADR-0004 theming still works.
3. **The manifest records the delivery per icon** (`delivery: use | img | mask`) and the stack URL next to the sprite URL. This answers Q-05 for v0.1. The field names are fixed in the output contract (TSK-004).
4. **`<style>` must be fully inlined (ADR-0004 confirmed).** A raw `<style>` in an external sprite leaks across symbols in Chromium and is ignored by Firefox and WebKit. The stack's single `:target` rule is generated by svgworm and is the only `<style>` allowed in output.
5. **Q-03:** `viewBox` on `<symbol>` is enough for sizing in all three engines. Adapters may still put the same `viewBox` on the consumer `<svg>`. It's harmless and gives an intrinsic aspect ratio, but it is not required for correctness.
6. **Q-06:** an icon without `viewBox` gets `viewBox="0 0 W H"` when its root `width` and `height` are both plain numbers or `px`. The CLI lists those icons in its report, so the change isn't silent. Any other case (missing, `%`, `em`) is an error. Evidence: a symbol without `viewBox` is not scaled in any engine.
7. **Q-02:** sprites must be served **same-origin**. Every engine blocks a cross-origin `<use>`, even with a permissive CORS header. svgworm documents this constraint and recommends serving the output directory from the app's own origin. No workaround is built in v0.1.
8. **Browser-check method:** Playwright drives its bundled Chromium, Firefox, and WebKit. Each case is compared with the original fixture rendered as `<img>` by the same engine. Alpha is recovered from a white/black screenshot pair, and cells sit on an integer pixel grid. Thresholds: 1% of pixels by coverage (Δ > 64) or by color (Δ > 40). This is recorded in `.claude/rules/testing.md`. It is a dev-only tool, so no consumer pays for it. TSK-009 still picks the test runner that hosts it.

## Evidence

- [TSK-002 spike results](../../spikes/TSK-002-external-use/RESULTS.md) and the generated [matrix](../../spikes/TSK-002-external-use/results/matrix.md) (two runs, identical), with per-engine screenshots in `spikes/TSK-002-external-use/results/`.
- Minimal variants isolate the WebKit failure: gradient, clipPath, mask, and filter fail whether defined inside the symbol or in a root `<defs>`. Firefox fails only on a mask containing `<use>` defined inside the symbol.
- Cross-origin console errors, quoted in the results:
  - Chromium and WebKit: "Unsafe attempt to load URL … Domains, protocols and ports must match."
  - Firefox: "Security Error: Content at … may not load data from …".
- WebKit bug [105904](https://bugs.webkit.org/show_bug.cgi?id=105904), "SVG external use doesn't work with animation, gradients, filters". Reported in 2013 and closed without a code fix, it matches the observed class of failure.

## Consequences

- **This brings part of Q-05 into v0.1, against the deferral in ADR-0005.** ADR-0005 deferred Q-05 "with inline fallback". The fallback chosen here is not inline: it's a second external file, with no inline delivery and no JS. Without it, ADR-0005's own positioning ("gradients and masks that render") is false in Safari. ADR-0005's decision and kill criteria are unchanged. The scope it adds:
  - a reference-dependency check in the core;
  - a second emitted file;
  - a `delivery` field in the manifest;
  - three render branches in the React adapter.
- The output contract gains the stack file and `delivery` (TSK-004 fixes names and URL handling). The adapter needs both URLs. This is the delivery gap of LRN-002, now with two files.
- Many Figma exports wrap content in a `clipPath` that covers the whole `viewBox`. WebKit ignores the clip, and that is invisible because the clip does nothing (both Figma fixtures pass). The core should drop such no-op clips before the check in rule 2, so these icons stay on `<use>`. This is an implementation detail for the optimizer step (TSK-009).
- **Real Safari and iOS still need a manual check** before v0.1 ships, because Playwright's WebKit isn't the Safari binary. The rule is safe either way: if Safari does support references, those icons just take the fallback without needing it.
- Not measured: the cost of many `<img src="stack.svg#…">` on one page, cross-origin behavior of the stack forms, patterns and markers (no fixture), forced-colors mode. Keep the stack limited to reference-dependent icons.
- Inline delivery (post-v0.1) must keep inlining every `<style>`, because inline sprites leak `<style>` into the page in all three engines.
