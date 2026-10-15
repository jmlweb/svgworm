---
'svgworm': patch
---

`svgworm init` now works with Yarn 2+ (Berry, including Plug'n'Play), which never runs `predev` or `prebuild`. Before, the sprite was silently never built. When it finds Yarn 2+ (a `packageManager` of `yarn@2` or later, a `.yarnrc.yml`, or a Berry `yarn.lock`, also at a workspace root), init prefixes the `dev` and `build` scripts with `svgworm &&` instead. It leaves a script that is missing or that uses `||`, `;` or `&` untouched and prints a warning naming it. `init --json` reports that warning as `warning` on the `package.json` action.
