---
'svgworm': patch
---

`svgworm init` fixes from dogfooding in monorepos and non-Next projects:

- `--source` may point outside the project folder (`../../packages/icons/svg`), as `build` and `check` already allowed. The sample icon is never written into such a folder.
- Run from a subfolder of a package (for example `src/`), `init` now stops with exit code 2 and names the folder that holds `package.json`, instead of writing a config there and skipping the component.
- A framework chosen at the interactive prompt is reported as `(prompt)`, and `frameworkSource` in `--json` is `"prompt"`, not `"flag"`.
- The Astro `base` hint says to set `publicPath` in `svgworm.config.json`, because `init` never edits an existing config.
- The public-path prompt mentions the Next `basePath` only when `next` is a dependency (and the Astro `base` for Astro). The React next step says "Server Component" only for Next.js; Vite and plain React get "component".
