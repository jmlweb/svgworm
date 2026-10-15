---
'svgworm': patch
'@svgworm/react': patch
---

Smoother first run on real projects:

- SVGs exported by Illustrator and other design tools no longer fail with `style/leftover` because of unused classes in their `<style>`. Rules that match nothing are dropped. A rule that really cannot be inlined (such as `:hover` on an element that exists) still fails, and the message now lists those selectors.
- Every CSS named color is recognized when deciding mono or multicolor (before, only 31 names were known).
- The `outDir is inside a source folder` error says how to fix it: move the icons out of `public/`, or write the sprites elsewhere with `--out-dir`.
- The components `svgworm init` writes (`icon.tsx`, `Icon.astro`, `SvgwormLoader.astro`) fit in 80 columns, so they pass a default ESLint `max-len`.
- The docs state that `@svgworm/react` needs React 19 (Next.js 15 or later).
