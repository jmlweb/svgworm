---
'svgworm': patch
---

Use absolute `sources`, `outDir` and `moduleDir` as given. `build`, `check` and `watch` wrote an absolute `outDir` or `moduleDir` to a copy of that path under the current folder, and reported an absolute source folder as not found.
