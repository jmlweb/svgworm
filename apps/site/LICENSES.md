# Site asset sources and licenses

Every third-party file in `apps/site` comes from a package with an OSS-compatible license. Versions are pinned. The full license texts are in `licenses/`.

| Files | Source | License |
|-------|--------|---------|
| `icons/*.svg` (15 files) | lucide-static 1.52.0, `icons/<same name>.svg`, unmodified | ISC (`licenses/lucide-ISC.txt`) |
| `icons/emoji/*.svg` (6 files: worm, seedling, mushroom, rock, snail, carrot) | @iconify-json/fluent-emoji-flat 1.2.6, the icon's `body` from `icons.json` wrapped in `<svg viewBox="0 0 32 32">` (Iconify) | MIT, Microsoft Corporation (`licenses/fluent-emoji-MIT.txt`) |
| `public/fonts/bricolage-grotesque.174b8e47.woff2` | @fontsource-variable/bricolage-grotesque 5.3.0, `files/latin-opsz-normal`, subset and pinned (below) | OFL-1.1 (`licenses/bricolage-grotesque-OFL.txt`) |
| `public/fonts/instrument-sans.2ee17598.woff2` | @fontsource-variable/instrument-sans 5.3.0, `files/latin-wght-normal`, only renamed | OFL-1.1 (`licenses/instrument-sans-OFL.txt`) |
| `public/fonts/jetbrains-mono.e1ccbad5.woff2` | @fontsource-variable/jetbrains-mono 5.3.0, `files/latin-wght-normal`, subset and narrowed (below) | OFL-1.1 (`licenses/jetbrains-mono-OFL.txt`) |

The packages were fetched with `npm pack` and are not dependencies. The logo files and `public/favicon.svg` (a copy of `docs/assets/logo-mark.svg`) are svgworm's own.

## Font modifications (TSK-051)

These are modified versions, which the OFL allows; they only remove glyphs and variation range, and the OFL texts stay in `licenses/`. Done once with fontTools 4.67.0 (`pyftsubset`, `fontTools.varLib.instancer`) and brotli 1.2.0 in a throwaway virtualenv outside the repo; neither tool is a dependency. Source and result:

| Font | Subset (Unicode) | Axes | Size |
|------|------------------|------|------|
| Bricolage Grotesque | U+0020-007E, U+00B7, U+00E9, U+2013-2014, U+2018-201D, U+2022, U+2026, U+2192, U+2197; features kern, liga, calt, ccmp, locl, mark, mkmk; no hinting | `wght` pinned to 800, `opsz` limited to 72-96 (the h1 and h2 settings; auto optical sizing clamps into it) | 75 KB to 18.7 KB |
| JetBrains Mono | U+0020-007E, U+00A0-00FF, U+2013-2014, U+2018-201D, U+2022, U+2026, U+2192, U+2197; all layout features; no hinting | `wght` limited to 400-700 | 39.5 KB to 27.7 KB |

Font file names are `<family>.<first 8 hex of the SHA-256 of the file>.woff2`, so the immutable cache rule for `/fonts/*` is safe. When a font changes, rename the file to its new hash and update `src/styles/base.css`, `src/layouts/Base.astro` and `og/og.html`; `scripts/check-output.mjs` fails on a stale hash, an unreferenced font, or a referenced one that is missing. Any character outside a subset falls back to the next family in the stack, so add it to the subset when site text starts using it.
