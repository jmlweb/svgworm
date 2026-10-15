---
'svgworm': minor
---

A `sources` entry can now be `{ "dir", "include", "exclude" }` as well as a folder path. `include` keeps only the files that match one of its globs and `exclude` drops matches after that, both on the `/`-separated path inside `dir` (`house.svg`, `arrows/*.svg`, `**/arrow-*.svg`, `{a,b}.svg`). This picks icons from a package such as `lucide-static` or `@tabler/icons` without copying files out of `node_modules`; names are unchanged (the path inside `dir`, so `house`). A source folder may be a symlink, as packages are in a pnpm `node_modules`. The JSON Schema and `ResolvedConfig.sources` (now `{ dir, include?, exclude? }` objects, a string normalizes to `{ dir }`) follow. Decided in ADR-0020.
