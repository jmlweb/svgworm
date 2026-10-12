# svgworm compared with other SVG icon tools

An honest comparison. For each tool it says what it does well and when to pick it instead of svgworm. Numbers come from the spikes in this repo, and each one links to its source. Where we did not test a tool ourselves, the page says so.

Versions, dates and download counts come from npm on 2026-10-08 ([viability.md](viability.md#competitive-landscape)).

## Short version

| If you…                                                                                      | Use                                                                       |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Have your own icon folder in a Next.js App Router app and want zero client JS and no glue    | **svgworm**                                                               |
| Want one component per icon, tree-shaken, and accept the JS cost                             | [SVGR](https://github.com/gregberge/svgr)                                 |
| Use Vite, want a sprite plus types, and your icons are all single-color                      | [vite-plugin-icons-spritesheet](https://github.com/forge42dev/vite-plugin-icons-spritesheet) |
| Need several sprites, a watcher, or a webpack/Vite plugin today                              | [@neodx/svg](https://neodx.pages.dev/svg/)                                |
| Want icons from public sets (Lucide, Material, …) without owning SVG files                   | [unplugin-icons](https://github.com/unplugin/unplugin-icons) / Iconify    |

## What svgworm does differently

- **Per-icon color.** Each icon is classified as mono or multicolor. Mono icons follow `currentColor`; multicolor icons keep their colors. In [TSK-003](../spikes/TSK-003-color-classification/RESULTS.md) the classifier agreed with rendering on 99.98% of 31,390 icons and recolored no multicolor icon.
- **Gradients, masks and filters render in every engine.** WebKit resolves no `url(#…)` reference inside an external `<use>` sprite ([TSK-002](../spikes/TSK-002-external-use/RESULTS.md)): gradient, mask and filter icons come out blank there. svgworm puts those icons in a second "stack" file and delivers them as `<img>` (multicolor) or a CSS mask (mono). [TSK-004](../spikes/TSK-004-sprite-url/RESULTS.md) renders all of them in Chromium, Firefox and WebKit with JavaScript disabled.
- **No bundler plugin.** It is a CLI that writes files, so it works the same under Turbopack, webpack and Vite.
- **Deterministic output.** The same input gives byte-identical files. Names are Unicode-normalized, so an NFC and an NFD `café.svg` give the same name and id ([TSK-006](../spikes/TSK-006-icon-naming/RESULTS.md)).
- **Errors, not silent fixes.** Name collisions and invalid SVGs stop the build and write nothing.

What it does **not** do yet (v0.1): several sprites, an inline sprite, incremental watch (`svgworm watch` rebuilds everything), and frameworks other than React. See the [backlog notes in AGENTS.md](../AGENTS.md) and [open-questions.md](open-questions.md).

## @neodx/svg

The closest competitor. MIT, CLI plus Node API plus unplugin, multiple sprites, hashed files, typed metadata.

We tested version 1.1.1 in Next.js 16.4 with Turbopack ([TSK-007](../spikes/TSK-007-neodx-next/RESULTS.md)):

| Check                                  | Result                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Documented setup (`@neodx/svg/webpack`) | Fails under Turbopack. Works with `next build --webpack`. Reported: [neodx#186](https://github.com/secundant/neodx/issues/186) |
| Node API as a `prebuild` script        | Works, about 12 lines of glue                                                                        |
| Server Components, zero client JS      | Works                                                                                                |
| Types and hashed URLs                  | Work                                                                                                 |
| Multicolor icons, default config       | Silently flattened to `currentColor`                                                                 |
| Gradient and mask icons                | Blank in SSR with the default `inline: 'auto'`; a 20-line workaround fixes it. Reported: [neodx#187](https://github.com/secundant/neodx/issues/187) |
| NFC vs NFD file name                   | Different id and sprite hash. Reported: [neodx#188](https://github.com/secundant/neodx/issues/188)  |

The three findings were reported upstream on 2026-10-12 before this page was published; if they get fixed, this table must change.

**Pick neodx when** you need multiple sprites or a Vite/webpack plugin now, or you are happy to set color rules by hand. Its defaults are tunable, and what we hit is the default behavior, not a hard limit. Its weekly downloads are small (about 2k), so expect fewer answers online.

## SVGR

Turns each SVG into a React component. 21.6M weekly downloads for `@svgr/core`.

- **Strengths:** works with any bundler, tree-shakes, every icon is a normal component you can style or animate, huge ecosystem.
- **Cost:** every icon becomes JavaScript, and the path data is repeated in the HTML each time the icon is rendered on the server. A sprite sends the path data once, in a cacheable file.
- **Not measured:** we have not run a bundle-size benchmark against SVGR. We do not publish a size ratio until we have one that anyone can reproduce.

**Pick SVGR when** you have a small icon set, need per-icon animation or props on inner paths, or you are not on a framework with Server Components.

## vite-plugin-icons-spritesheet

A Vite plugin that builds a sprite and types from a folder, and rebuilds on change. 248k weekly downloads.

- **Strengths:** tight Vite integration, hot rebuild in dev, simple.
- **Gaps in our landscape survey** ([viability.md](viability.md#competitive-landscape), from its docs): tied to Vite, one sprite, color handling.
- **Not tested:** we did not run it in a spike.

**Pick it when** you are on Vite and your icons are single-color.

## unplugin-icons and Iconify

Pull icons from public sets on demand and compile them to components. 841k weekly downloads.

**Pick it when** you want icons from public sets and do not own SVG files. svgworm is for your own folder. It does not fetch icons.

## Where to check our claims

Every spike has a script and a results file. Run them yourself:

| Claim                                       | Source                                                              |
| ------------------------------------------- | ------------------------------------------------------------------- |
| Color classification, 31,390 icons          | [spikes/TSK-003-color-classification](../spikes/TSK-003-color-classification/RESULTS.md) |
| WebKit and external `<use>` references      | [spikes/TSK-002-external-use](../spikes/TSK-002-external-use/RESULTS.md) |
| Delivery forms in 3 engines, JS off, Next 16 | [spikes/TSK-004-sprite-url](../spikes/TSK-004-sprite-url/RESULTS.md) |
| neodx in Next 16 + Turbopack                | [spikes/TSK-007-neodx-next](../spikes/TSK-007-neodx-next/RESULTS.md) |
| Naming and Unicode                          | [spikes/TSK-006-icon-naming](../spikes/TSK-006-icon-naming/RESULTS.md) |

Found a mistake, or a tool we describe unfairly? Open an issue. We correct this page.
