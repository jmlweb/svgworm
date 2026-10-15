---
'svgworm': patch
---

The `Icon.astro` that `svgworm init` writes now keeps an object `style` on mask-delivered (mono stack) icons. Before, only a string `style` reached the rendered `<span>`; an object was silently dropped. The object is serialized the way React does it: camelCase keys become kebab-case, bare numbers get `px` except for unitless properties such as `opacity` and `z-index`, and custom properties (`--size`) pass through. Re-run `svgworm init` to regenerate the component, or copy the `userStyle` block from a fresh init.
