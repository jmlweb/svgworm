# Your multicolor icons turn black because the sprite tool guessed wrong

> Published 2026-10-15 as a LinkedIn article, a LinkedIn post and an X thread (TSK-028); this file is the record. Target: a Next.js developer whose design team exports SVGs with hardcoded colors. Lead with the symptom, show the numbers, link every claim to the spike. Cover: https://svgworm.com/og.png (1200x630, on-brand). Body image: `per-icon-color.png` (see the end); at about 2.1:1 it would be cropped as a 16:9 cover. LinkedIn articles have no tables and no code formatting, and they do not parse Markdown: paste rich text rendered from this file, with the results table as a list.

You export icons from Figma. Some are one color and should follow the text color. Some are logos, flags, illustrations, and should stay exactly as drawn. You drop them in a sprite tool, and it does one of two things: it leaves the fills alone, so your "mono" icons stay `#1E1E1E` forever and ignore dark mode, or it replaces every fill with `currentColor`, and your logos come out as black blobs.

The sprite tools I [compared](https://svgworm.com/docs/comparison/) make this a global setting. One rule for the whole folder. The folder is never that uniform.

## The question

Can a build tool decide **per icon**, from the SVG alone, whether it is safe to turn into `currentColor`? And can it make that change without altering how the icon looks?

If yes, there is no setting. Mono icons follow `color`, multicolor icons keep their colors, and nobody opens a config file.

## The test

I did not want to trust my own eyes on a dozen icons, so I built a corpus of **31,390 icons** from pinned npm packages ([method and numbers](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/RESULTS.md)):

- 17,340 from `currentColor` libraries: lucide, heroicons, tabler, phosphor, simple-icons;
- 11,621 with hardcoded colors: devicon, flag-icons, noto emoji, logos, fluent-emoji, flat-color-icons;
- 2,429 synthetic "design tool exports": heroicons and lucide rewritten the way Figma and Illustrator export them (hardcoded `#1E1E1E`, a white clipping rect, `<style>` classes).

Ground truth came from rendering, not from reading the file ([oracle](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/src/evaluate.mjs)). Each icon was rasterized with resvg with a magenta inherited `color`. If more than 0.2% of visible pixels (alpha 64 or more) differ from the dominant color by more than 12 per channel, the icon is multicolor. Otherwise it is mono.

The [classifier](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/src/color.mjs) is static analysis on the SVG tree:

1. Inline `<style>` rules and `style=""` into attributes.
2. Walk only what renders. Skip `defs`, `clipPath`, `mask`, `symbol`, `marker`, `pattern`, and anything `display="none"`. Follow `<use>`, gradients, and filters.
3. Resolve the effective `fill` and `stroke` of each shape with inheritance. The default black fill counts. `none`, transparent, and zero-width strokes do not.
4. Count every gradient stop, transparent ones included. A stop that fades to transparent white still tints the gradient. (This was a bug I only found because `logos/scaledrone` was misclassified.)
5. `<image>`, `<foreignObject>`, `feImage` and patterns are multicolor by definition.
6. Merge colors that differ by 8 or less per channel (`#000000` and `#010101` are export noise). One color left, or only `currentColor`: mono. More: multicolor.

## The result

Full tables, including how the numbers move with the oracle's threshold, are in the [spike results](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/RESULTS.md#results).

| | |
|---|---|
| Agreement with rendering, all 31,390 icons | **99.98%** |
| Multicolor icons wrongly called mono (would have been recolored) | **0** |
| Mono icons wrongly called multicolor (kept as drawn, harmless) | 5 |
| Mono rewrites that render pixel-identical in the new color | **21,667 of 21,667** |

The five misses are colors hidden under other shapes (d3js, uwsgi) or details below the oracle's 0.2% share (the `xx` flag, a white speck in gulp). Static analysis cannot see occlusion. Calling those multicolor is the safe mistake.

The number that matters is the zero. If the tool is going to be wrong, it must be wrong in the direction that keeps your logo intact.

## The rewrite has a trap

Turning a mono icon into `currentColor` sounds like `fill="currentColor"` on the root. It is not.

A `<mask>` inherits paint from where it is declared, not from the shape it masks. Set `currentColor` on the root and the mask's white rectangle becomes the text color. On a dark theme the mask goes dark, the luminance drops, and the shape partially disappears. Rewriting the mask's white to `currentColor`, as some tools do, has the same effect. I kept that rewrite as the spike's [negative control](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/RESULTS.md#method): it shrinks the rendered coverage from 2,029,875 pixels to 437,829.

So the [rewrite](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-003-color-classification/RESULTS.md#classifier-srccolormjs) replaces each paint value on the element that declares it, freezes the inherited fill on masks first, leaves `clipPath` content alone, and sets `fill="currentColor"` on the root only when the icon relies on the default black.

## What this means for a Next.js or Astro app

This is the core of [svgworm](https://svgworm.com), a CLI that turns a folder of SVGs into a hashed sprite plus a manifest and TypeScript types. In Next.js a React Server Component `Icon` renders the icons with zero client JavaScript; in Astro, `svgworm init` writes a dependency-free `Icon.astro` that does the same. Color is decided per icon with the rules above, and it can be overridden per glob when you know better.

svgworm 0.2 is on npm. In Next.js: `pnpm add -D svgworm && pnpm add @svgworm/react`, then `pnpm svgworm init`. In Astro: `pnpm add -D svgworm`, then `pnpm svgworm init`. The setup guides and an honest [comparison with SVGR and @neodx/svg](https://svgworm.com/docs/comparison/) are on [svgworm.com](https://svgworm.com/docs/). The classification spike and the [browser rendering tests](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-002-external-use/RESULTS.md) (WebKit resolves no gradient, mask, clipPath or filter inside an external `<use>`, so those icons take a [different path](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md)) are in the [repo](https://github.com/jmlweb/svgworm). If you have an icon folder that breaks it, open an issue with the file. That is exactly the corpus I want.

---

## Image to make

Before/after, one image: a row of six icons (a mono heroicon, a lucide stroke icon, the Kotlin gradient logo, a flag, a Figma-style export with `#1E1E1E`, a Next.js logo with a mask) rendered three times on a dark background with `color: #0a7`:

1. "As exported": mono icons stay dark grey, invisible on dark.
2. "Global currentColor" (what a folder-wide setting does): everything green, logos and flag destroyed, mask shape broken.
3. "Per icon" (svgworm): mono icons green, logos and flag intact, mask intact.

The example app in `examples/next-app-router` renders row 3 already; rows 1 and 2 can be built from the same fixtures with the color rules forced (`preserve` for all, `mono` for all).

## X thread

Attach `per-icon-color.png` to post 1. Replace `[article]` with the LinkedIn article URL.

1.
```text
Your multicolor icons turn black because your sprite tool has one color setting for the whole folder.

I tested whether a build tool can decide per icon instead, on 31,390 icons.
```

2.
```text
Ground truth came from rendering each icon, not from reading the file.

The classifier is static analysis: the effective fill and stroke of every shape that renders, with inheritance, gradient stops included.
```

3.
```text
Result:
- 99.98% agreement with rendering
- 0 multicolor icons recolored
- 21,667 of 21,667 mono rewrites render identically in the new color

The 5 misses are all on the safe side: icons kept as drawn.
```

4.
```text
The trap: fill="currentColor" on the root breaks masks. A mask inherits paint where it is declared, so its luminance follows the text color and the shape fades on dark themes.

Fix: rewrite paint per element and freeze mask fills first.
```

5.
```text
This is the default in svgworm: a CLI that turns an SVG folder into a hashed sprite plus types, with zero client JS in Next.js Server Components or Astro. 0.2 is on npm.

Write-up: [article]
Docs: https://svgworm.com
Code: https://github.com/jmlweb/svgworm
```

## LinkedIn commentary (publish dialog)

Paste into "Tell your network what your article is about" when you click Publish. LinkedIn attaches the article to this feed post, so it needs no article link.

```text
Your multicolor icons turn black because your sprite tool has one color setting for the whole folder. Logos and flags get flattened, or mono icons ignore dark mode.

I tested whether a build tool can decide per icon instead, from the SVG alone. On 31,390 icons (28,961 from 11 open-source sets, 2,429 synthetic Figma-style exports), static analysis agreed with rendering on 99.98% of them, recolored zero multicolor icons, and all 21,667 mono rewrites rendered identically in the new color. One trap along the way: fill="currentColor" on the root breaks masks.

The write-up has the method, the numbers and the mask fix. It is the default behavior of svgworm, an open-source CLI that turns an SVG folder into a type-safe sprite for Next.js Server Components and Astro, with zero client JavaScript.

Docs: https://svgworm.com
Code and spike results: https://github.com/jmlweb/svgworm

#nextjs #astro #react #svg #webdev #opensource
```
