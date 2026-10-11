---
'svgworm': minor
'@svgworm/react': minor
---

First working build: `svgworm` turns a folder of SVG files into a content-hashed sprite, a stack file for icons with `url(#...)` references, a manifest module, and types, following output contract v0.1. It adds the CLI (`--source`, `--out-dir`, `--public-path`, `--module-dir`, `--flatten`, `--json`), per-icon color classification, collision and invalid-SVG errors that write nothing, and stale-sprite cleanup. Exit codes are `0` built, `1` invalid input or I/O failure, `2` usage or config error. `@svgworm/react` is versioned together with `svgworm` and has no changes yet.
