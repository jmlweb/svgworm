---
'svgworm': patch
---

Describe `sources` and `dir` in the config JSON Schema as relative to the working directory (the Vite `root` for `svgworm/vite`), which is how svgworm resolves them, also for a `--config` file in another folder. The descriptions said "relative to the config".
