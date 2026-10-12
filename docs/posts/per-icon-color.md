# Your multicolor icons turn black because the sprite tool guessed wrong (draft)

> Draft for jmlweb.es (TSK-028). Target: a Next.js developer whose design team exports SVGs with hardcoded colors. Lead with the symptom, show the numbers, link every claim to the spike. Publish before v0.1.0 and record the date in TSK-028 and `docs/metrics/manual.json`. Needs one before/after image (see the end).

You export icons from Figma. Some are one color and should follow the text color. Some are logos, flags, illustrations, and should stay exactly as drawn. You drop them in a sprite tool, and it does one of two things: it leaves the fills alone, so your "mono" icons stay `#1E1E1E` forever and ignore dark mode, or it replaces every fill with `currentColor`, and your logos come out as black blobs.

Every sprite tool I looked at makes this a global setting. One rule for the whole folder. The folder is never that uniform.

## The question

Can a build tool decide **per icon**, from the SVG alone, whether it is safe to turn into `currentColor`? And can it make that change without altering how the icon looks?

If yes, there is no setting. Mono icons follow `color`, multicolor icons keep their colors, and nobody opens a config file.

## The test

I did not want to trust my own eyes on a dozen icons, so I built a corpus of **31,390 icons** from pinned npm packages ([method and numbers](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/RESULTS.md)):

- 17,340 from `currentColor` libraries: lucide, heroicons, tabler, phosphor, simple-icons;
- 11,621 with hardcoded colors: devicon, flag-icons, noto emoji, logos, fluent-emoji, flat-color-icons;
- 2,429 synthetic "design tool exports": heroicons and lucide rewritten the way Figma and Illustrator export them (hardcoded `#1E1E1E`, a white clipping rect, `<style>` classes).

Ground truth came from rendering, not from reading the file. Each icon was rasterized with resvg with a magenta inherited `color`. If more than 0.2% of visible pixels differ from the dominant color by more than 12 per channel, the icon is multicolor. Otherwise it is mono.

The classifier is static analysis on the SVG tree:

1. Inline `<style>` rules and `style=""` into attributes.
2. Walk only what renders. Skip `defs`, `clipPath`, `mask`, `symbol`, `marker`, `pattern`, and anything `display="none"`. Follow `<use>`, gradients, and filters.
3. Resolve the effective `fill` and `stroke` of each shape with inheritance. The default black fill counts. `none`, transparent, and zero-width strokes do not.
4. Count every gradient stop, transparent ones included. A stop that fades to transparent white still tints the gradient. (This was a bug I only found because `logos/scaledrone` was misclassified.)
5. `<image>`, `<foreignObject>`, `feImage` and patterns are multicolor by definition.
6. Merge colors that differ by 8 or less per channel (`#000000` and `#010101` are export noise). One color left, or only `currentColor`: mono. More: multicolor.

## The result

| | |
|---|---|
| Agreement with rendering, all 31,390 icons | **99.98%** |
| Multicolor icons wrongly called mono (would have been recolored) | **0** |
| Mono icons wrongly called multicolor (kept as drawn, harmless) | 5 |
| Mono rewrites that render pixel-identical in the new color | **21,667 of 21,667** |

The five misses are colors hidden under other shapes (d3, uwsgi) or details too small for the oracle (a white speck in gulp). Static analysis cannot see occlusion. Calling those multicolor is the safe mistake.

The number that matters is the zero. If the tool is going to be wrong, it must be wrong in the direction that keeps your logo intact.

## The rewrite has a trap

Turning a mono icon into `currentColor` sounds like `fill="currentColor"` on the root. It is not.

A `<mask>` inherits paint from where it is declared, not from the shape it masks. Set `currentColor` on the root and the mask's white rectangle becomes the text color. On a dark theme the mask goes dark, the luminance drops, and the shape partially disappears. I measured it: the same icon rendered with the naive rewrite covers 437,829 pixels instead of 2,029,875.

So the rewrite replaces each paint value on the element that declares it, freezes the inherited fill on masks first, leaves `clipPath` content alone, and sets `fill="currentColor"` on the root only when the icon relies on the default black.

## What this means for a Next.js app

This is the core of [svgworm](https://github.com/jmlweb/svgworm), a CLI that turns a folder of SVGs into a hashed sprite plus a manifest and TypeScript types, with a React Server Component `Icon` that ships zero client JavaScript. Color is decided per icon with the rules above, and it can be overridden per glob when you know better.

It is pre-release. The classification spike, the browser rendering tests (gradients and masks do not render through an external `<use>` in WebKit, so those icons take a different path), and an honest [comparison with SVGR and @neodx/svg](https://github.com/jmlweb/svgworm/blob/main/docs/comparison.md) are all in the repo. If you have an icon folder that breaks it, open an issue with the file. That is exactly the corpus I want.

---

## Image to make

Before/after, one image: a row of six icons (a mono heroicon, a lucide stroke icon, the Kotlin gradient logo, a flag, a Figma-style export with `#1E1E1E`, a Next.js logo with a mask) rendered three times on a dark background with `color: #0a7`:

1. "As exported": mono icons stay dark grey, invisible on dark.
2. "Global currentColor" (what a folder-wide setting does): everything green, logos and flag destroyed, mask shape broken.
3. "Per icon" (svgworm): mono icons green, logos and flag intact, mask intact.

The example app in `examples/next-app-router` renders row 3 already; rows 1 and 2 can be built from the same fixtures with the color rules forced (`preserve` for all, `mono` for all).

## Social thread (cross-post)

1. Your multicolor icons turn black because your sprite tool has one color setting for the whole folder. I tested whether a build tool can decide per icon instead. 31,390 icons. Thread.
2. Ground truth by rendering, not by reading the file. Classifier: static analysis of effective fill/stroke, gradients included.
3. 99.98% agreement. Zero multicolor icons recolored. 21,667 mono rewrites, all pixel-identical in the new color.
4. The trap: `fill="currentColor"` on the root breaks masks. Mask luminance follows the text color and the shape disappears. Rewrite per element, freeze masks.
5. This is what svgworm does by default, in a Next.js Server Component with zero client JS. Pre-release, numbers and code: [repo link]. Post: [link].
