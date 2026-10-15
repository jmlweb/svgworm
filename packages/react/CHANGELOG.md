# @svgworm/react

## 0.3.0

### Minor Changes

- 5ba1d5c: Reads the version 2 manifest that `crossOrigin: "inject"` writes (ADR-0027): `use` icons render `<use href="#id">` against the sprite the loader injects, and the new `createSpriteLoader(manifest)` renders the loader tag (`<script async src integrity crossorigin="anonymous">`) once, in the root layout. It renders nothing for a same-origin manifest, so version 1 output works exactly as before.
  
  **Breaking (inject mode only):** a version 2 manifest is rejected by earlier `@svgworm/react` releases with "Unsupported svgworm manifest version 2"; update both packages together.

### Patch Changes

- 5ef810a: Errors now say what to do next:
  
  - An unknown CLI flag suggests the closest known one (`unknown flag "--sources". Did you mean "--source"?`) instead of Node's positional-argument explanation.
  - A `name/collision` error ends with a fix: rename one of the files, or turn `flatten` off when the files sit in different folders.
  - The `Unknown icon` error thrown by the `@svgworm/react` component lists the closest icon names from the manifest.
  - An `svg/invalid-xml` message reads `line 2, column 0: …` instead of showing svgo's `<input>:2:0:` placeholder as the location.

## 0.2.1

### Patch Changes

- 38ac75f: The npm package pages link to the docs on the website, https://svgworm.com/docs, instead of to the Markdown files on GitHub, the `svgworm` README mentions the Astro setup, and the emoji bullets are gone.

## 0.2.0

### Patch Changes

- 636c0db: The npm package pages link to the new website, https://svgworm.com.
- 8624f2e: The README on npm and GitHub now leads with an example and a short get-started; the CLI, config and Next.js reference moved to `docs/`.
- a9abc37: The package READMEs on npm describe the released 0.1 instead of a pre-alpha.

## 0.1.0

### Minor Changes

- 46ca9d8: Add `createIcon(manifest)`, a hook-free Server Component factory. Pass the generated `manifest` once and get an `Icon` whose `name` prop is typed against the generated icon names. It renders each icon by its manifest `delivery` (`use`, `img` or `mask`), resolves URLs and symbol ids from the manifest, and is `aria-hidden` unless a `title` or `label` is given. It throws `SvgwormReactError` for an unknown manifest version, an unknown name, or a missing sprite or stack file.
- eebb113: First working build: `svgworm` turns a folder of SVG files into a content-hashed sprite, a stack file for icons with `url(#...)` references, a manifest module, and types, following output contract v0.1. It adds the CLI (`--source`, `--out-dir`, `--public-path`, `--module-dir`, `--flatten`, `--json`), per-icon color classification, collision and invalid-SVG errors that write nothing, and stale-sprite cleanup. Exit codes are `0` built, `1` invalid input or I/O failure, `2` usage or config error. `@svgworm/react` is versioned together with `svgworm` and has no changes yet.

### Patch Changes

- 0da4021: Publish `svgworm.schema.json`, the JSON Schema of `svgworm.config.json`, and export it as `svgworm/schema.json`. Add package READMEs and npm keywords. `pnpm schema:generate` regenerates the file, and a test fails when it is stale.
- a9aff9d: Hardening from the pre-release code and security review.
  
  - Validation rejects `<script>` and other embedding elements under any namespace prefix (`<x:script>` was accepted and reached the sprite), `<foreignObject>`, CSS-escaped `url()` references, `javascript:` with embedded whitespace, SMIL that retargets `href` or event handlers, and `data:` hrefs that are not raster images.
  - Output files are written through a temporary file and renamed into place: a reader never sees a half-written module, and a symlink at the output path is replaced instead of followed. Files whose bytes did not change are left untouched, so `svgworm watch` next to a dev server no longer triggers reloads for no-op saves.
  - `svgworm watch` attaches its watchers before the first build (edits during it are no longer lost), reports a failed watcher instead of going quiet, never rebuilds after Ctrl+C, and waits for a build in flight before exiting. Ctrl+C ends `build` and `check` at once again.
  - `svgworm init` refuses paths outside the project or containing quotes, backticks or line breaks, validates the config it is about to write with the same rules as `build`, keeps a custom `--config` in the scripts it adds, preserves `package.json` line endings and indentation after a blank line, keeps several `--source` folders in interactive mode, and never overwrites a file that appeared or changed while its prompts were open.
  - `svgworm check` reports read errors other than a missing file instead of listing the file as missing.
  - `@svgworm/react` forwards `id`, `data-*`, `aria-*` and other HTML attributes to the `img` and `mask` deliveries, and treats prototype keys such as `constructor` as unknown icons.
