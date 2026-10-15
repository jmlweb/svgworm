---
'@svgworm/react': patch
'svgworm': patch
---

Fix icons whose `viewBox` does not start at `0 0` (for example `19 19 106 106`, common in cropped logos and flags) rendering shifted and clipped. `Icon` from `@svgworm/react` and the `Icon.astro` that `svgworm init` writes now give the `<svg>` only the viewBox size (`viewBox="0 0 106 106"`), and the symbol in the sprite keeps the origin ([ADR-0030](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0030-consumer-viewbox-keeps-only-the-size.md)).

Astro projects: `svgworm init` never overwrites a component you may have edited, so regenerate it. Delete `src/components/Icon.astro` (or `components/Icon.astro`) and run `svgworm init --yes`.
