---
title: How svgworm works
navTitle: How it works
description: "The model behind the files svgworm writes: one external sprite plus a stack file, why each icon gets a use, img or mask delivery, what the manifest and types carry, how names are derived, and why the output is byte-identical everywhere."
order: 7
---

svgworm is a build step, not a runtime. It reads a folder of SVG files and writes four kinds of files; the `Icon` component only reads them. Knowing what each file is for makes a blank icon or a wrong color easy to place.

```text
icons/               svgworm              public/icons/icons.<hash>.svg        the sprite
  home.svg       ─────────────▶           public/icons/icons.stack.<hash>.svg  the stack (only when needed)
  brand/sunset.svg                        svgworm/icons.js + icons.d.ts        the manifest and its types
                                          svgworm/manifest.json                the manifest for scripts
```

## The sprite

The sprite is one SVG file with a `<symbol id="i-home" viewBox="0 0 24 24">` per icon. The page references an icon with `<svg><use href="/icons/icons.<hash>.svg#i-home"/></svg>`: the browser fetches the sprite once, caches it, and draws the symbol inside each `<use>`. No icon code ships as JavaScript, which is the whole point ([ADR-0001](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0001-external-sprite-default.md)).

An external file rather than an inline `<svg>` in the HTML because it is cached across pages and it keeps the HTML small. The cost is one extra request on the first visit, and that the whole set downloads at once ([performance notes](/docs/nextjs/#performance-notes)). The file name carries the first 8 hex characters of the SHA-256 of its bytes, so it can be served with a year-long cache and still update the moment its content changes.

Before an icon goes into the sprite, svgworm validates it (no scripts, no event handlers, no references to other files), inlines any `<style>` rules into attributes so one icon's CSS can never reach another, optimizes it with [svgo](https://svgo.dev) using a fixed configuration, and prefixes every internal id (gradients, masks, clip paths) with the symbol id so two icons never collide. Comments are dropped, except license notices (`<!-- @license … -->` and `<!--! … -->`, as Lucide, Tabler and Font Awesome write them), which the sprite keeps once each before its root element, so an ISC or MIT notice travels with the copies.

## Color

Each icon is classified on its own ([ADR-0004](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0004-per-icon-color-classification.md)):

- **mono**: every fill and stroke is one color, or `currentColor`. svgworm rewrites those paints to `currentColor`, so the icon takes the `color` of the text around it.
- **multicolor**: the icon uses several colors, a gradient with several stops, a raster image, a pattern, a CSS variable or an animated color. It keeps what the file says.

The guess is right for most icon sets. When it is not, a [color override](/docs/config/#color-overrides) forces `mono` or `preserve` per icon. The manifest records the result as `color`.

## Delivery

Some SVG features do not render through an external `<use>` in WebKit: anything referenced with `url(#…)`, which means gradients, masks, clip paths, filters and markers ([ADR-0006](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md), checked in Chromium, Firefox and WebKit). Instead of dropping those features or inlining every icon, svgworm puts such icons in a second file, the **stack**, and records per icon how to show it. That is the `delivery` field in the manifest:

| `delivery` | When                                | What `Icon` renders                                            | Follows `color`? |
| ---------- | ----------------------------------- | -------------------------------------------------------------- | ---------------- |
| `use`      | No `url(#…)` reference (most icons) | `<svg><use href="sprite#id"/></svg>`                           | mono: yes        |
| `img`      | Needs the stack and is multicolor   | `<img src="stack#id">`                                         | no               |
| `mask`     | Needs the stack and is mono         | `<span style="mask: url(stack#id); background: currentColor">` | yes              |

The stack file is an "SVG stack": every icon is a nested `<svg id="…">` hidden by a `:target` rule, and the URL fragment shows exactly one. It is written only when an icon needs it. The [Icon reference](/docs/icon/#markup-per-delivery) shows the exact markup of each form.

## The manifest and the types

`svgworm/icons.js` exports one object, `manifest`, with the sprite and stack URLs and one entry per icon: `sprite` (the group), `id`, `viewBox`, `color` and `delivery`. It imports nothing and holds no SVG markup, which is why it is safe on the server and cheap to import. `svgworm/manifest.json` is the same object for templates and scripts, and `svgworm check` compares it with a fresh build.

`svgworm/icons.d.ts` declares `IconName`, the union of every icon name, and the manifest's shape. `createIcon(manifest)` and `Icon.astro` take `name: IconName`, so a name that is not in the set fails `tsc` or `astro check`, and the editor completes the valid ones. The union stays fast at every size: 20,000 names type-check in 0.14 s ([ADR-0014](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0014-icon-name-type-shape.md)).

The exact shape of these files is the [output contract](https://github.com/jmlweb/svgworm/blob/main/docs/output-contract.md), a public API: the adapters read nothing else, and changes to it come with an ADR and a changelog entry.

## Names

An icon's name is a pure function of its path inside the source folder ([ADR-0007](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0007-icon-naming-and-collision-policy.md)): `icons/brand/sunset.svg` is `brand/sunset`. Folders become namespaces (unless `flatten` is on), each segment is lower-cased and Unicode-normalized, and every run of spaces, `_`, `.` or other punctuation becomes one `-`. Accented and non-Latin names stay as they are (`café`), so they work as TypeScript string literals. Letter case is never split: `ArrowLeft.svg` is `arrowleft`, and the build prints a `name/case-folded` warning that suggests renaming it to `arrow-left.svg` ([ADR-0021](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0021-no-camel-case-splitting-warn-when-case-carried-meaning.md)).

The symbol id in the sprite is derived from the name: `i-` plus the name with `/` as `--` and any non-ASCII character as `_<hex>_` (`i-brand--sunset`, `i-caf_e9_`). It is always a valid HTML id, CSS identifier and URL fragment. Two files that produce the same name are an error that lists both; svgworm never renames or numbers anything silently.

## Deterministic output

The same input gives byte-identical output on every OS and every run. Files are sorted by code point before anything is written, path separators and Unicode normalization are unified, hashes come from content only, and nothing reads the clock, the locale or an absolute path. CI builds the fixture set on Linux, macOS and Windows and compares the fingerprints. The practical effect: committed output never changes without an icon changing, so `svgworm check` is a reliable gate and a review diff shows exactly what an icon change did.

## Where to read more

- [ADRs](https://github.com/jmlweb/svgworm/tree/main/docs/adr): the decisions above with their evidence, including the browser matrices.
- [Comparison](/docs/comparison/): how this model differs from per-icon components (SVGR) and from bundler plugins.
- [Troubleshooting](/docs/troubleshooting/): the symptoms this model explains.
