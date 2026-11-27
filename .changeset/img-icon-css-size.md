---
'svgworm': patch
'@svgworm/react': patch
---

Fix `img`-delivery icons (multicolor icons with gradients, masks, clip paths or filters) rendering at 1 x 1 px by default. The HTML `width` and `height` attributes of an `<img>` read `1em` as 1 pixel, so `createIcon` and the `Icon.astro`, `Icon.vue` and `Icon.svelte` that `svgworm init` writes now size the `<img>` with an inline style (`style="width:1em;height:1em"`), followed by your own `style`. The `width` and `height` props still set the size. A CSS class rule no longer resizes an `img` icon, because the inline size wins: use the props or `style`. `svgworm init` never overwrites a component file that differs from its template, so delete your generated `Icon.astro`, `Icon.vue` or `Icon.svelte` and run `svgworm init` again to get the fix.
