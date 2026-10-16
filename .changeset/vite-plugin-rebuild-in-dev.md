---
"svgworm": minor
---

Add an optional Vite plugin, `svgworm/vite`. Add `svgworm()` to `plugins` in `vite.config.ts`. It builds the sprite, manifest and types before `vite build`, and rebuilds them when an icon changes during `vite dev`, without a restart or a second `svgworm watch` process. A broken icon fails `vite build`, and in dev it shows in the terminal and the error overlay while the server keeps watching. When Vite has a `base` and `svgworm.config.json` sets no `publicPath`, the plugin stops `vite dev` and `vite build` with an error naming the `publicPath` to set, instead of letting every icon 404. `vite` (8.3 or later) is an optional peer; nothing changes for projects that do not use it. `ResolvedConfig` gains `isDefaultPublicPath` (ADR-0033).
