---
'svgworm': minor
---

Plain `svgworm` now works with no config file and no `--source` when an `icons/` folder exists. `sources` is optional (default `icons`) and may be a single string. The output says so: the plain reporter prints `svgworm: using default source icons/`, and every `--json` document gains a `sourcesDefaulted` boolean. `publicPath` is derived from an `outDir` under `public/` (`public/sprites` gives `/sprites`); any other `outDir` still needs `publicPath`. A Next `basePath` or an Astro/Vite `base` is never added for you (ADR-0029).
