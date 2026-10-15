---
'svgworm': minor
---

`svgworm init` now leaves a project that runs before you add any icon. When no source folder has an SVG, it adds a sample `icons/svgworm.svg` (CC0, icon name `svgworm`). Then it builds once, so `svgworm/icons.js` exists and the generated Icon component type-checks right away. Before this, `npm run dev` failed in the `predev` hook with `source folder not found` or `build/no-icons`. `init --json` gains a `build` key. If the first build fails, `init` keeps the files it wrote and exits 1 (or 2 for a setup problem).
