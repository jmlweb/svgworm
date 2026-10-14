# Site asset sources and licenses

Every third-party file in `apps/site` comes from a package with an OSS-compatible license. Versions are pinned. The full license texts are in `licenses/`.

| Files | Source | License |
|-------|--------|---------|
| `icons/*.svg` (13 files) | lucide-static 1.52.0, `icons/<same name>.svg`, unmodified | ISC (`licenses/lucide-ISC.txt`) |
| `icons/emoji/*.svg` (6 files: worm, seedling, mushroom, rock, snail, carrot) | @iconify-json/fluent-emoji-flat 1.2.6, the icon's `body` from `icons.json` wrapped in `<svg viewBox="0 0 32 32">` (Iconify) | MIT, Microsoft Corporation (`licenses/fluent-emoji-MIT.txt`) |
| `public/fonts/bricolage-grotesque-latin-opsz-normal.woff2` | @fontsource-variable/bricolage-grotesque 5.3.0, `files/` | OFL-1.1 (`licenses/bricolage-grotesque-OFL.txt`) |
| `public/fonts/instrument-sans-latin-wght-normal.woff2` | @fontsource-variable/instrument-sans 5.3.0, `files/` | OFL-1.1 (`licenses/instrument-sans-OFL.txt`) |
| `public/fonts/jetbrains-mono-latin-wght-normal.woff2` | @fontsource-variable/jetbrains-mono 5.3.0, `files/` | OFL-1.1 (`licenses/jetbrains-mono-OFL.txt`) |

The packages were fetched with `npm pack` and are not dependencies. The logo files and `public/favicon.svg` (a copy of `docs/assets/logo-mark.svg`) are svgworm's own.
