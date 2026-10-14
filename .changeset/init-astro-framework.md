---
'svgworm': minor
---

`svgworm init` supports Astro: it detects an `astro` dependency and writes a dependency-free `Icon.astro` that renders the same markup as `@svgworm/react`, with no client JavaScript. The new `--framework <react|astro>` flag overrides detection (Astro wins when both are dependencies), a `--component-file` whose extension does not match the framework exits with code 2, and plain and `--json` output report `framework` and `frameworkSource`.
