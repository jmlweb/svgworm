# svgworm

## 0.2.1

### Patch Changes

- 38ac75f: The npm package pages link to the docs on the website, https://svgworm.com/docs, instead of to the Markdown files on GitHub, the `svgworm` README mentions the Astro setup, and the emoji bullets are gone.

## 0.2.0

### Minor Changes

- 531bf15: `svgworm init` supports Astro: it detects an `astro` dependency and writes a dependency-free `Icon.astro` that renders the same markup as `@svgworm/react`, with no client JavaScript. The new `--framework <react|astro>` flag overrides detection (Astro wins when both are dependencies), a `--component-file` whose extension does not match the framework exits with code 2, and plain and `--json` output report `framework` and `frameworkSource`.

### Patch Changes

- 636c0db: The npm package pages link to the new website, https://svgworm.com.
- 8624f2e: The README on npm and GitHub now leads with an example and a short get-started; the CLI, config and Next.js reference moved to `docs/`.
- a9abc37: The package READMEs on npm describe the released 0.1 instead of a pre-alpha.

## 0.1.0

### Minor Changes

- 2726847: Add `svgworm check` and `svgworm watch`. `check` compiles the icons, compares the result with the files on disk without writing, lists each missing, changed or stale file plus the icon names added or removed, and exits `1` when the committed output is stale (`0` when up to date). `watch` builds once and rebuilds everything after each change in a source folder, until Ctrl+C. Both take the same flags as `build`, including `--json`. The programmatic API gains `check`, `watch` and `compileFromDisk`.
- c68a13f: Color classification now sees markers, CSS variable paints and SMIL color animations (ADR-0013). Marker content counts toward an icon's colors and is recolored with the icon when it is mono, so a mono line with a differently colored arrowhead is multicolor instead of being half recolored. A `var(--…)` paint or an `<animate>`/`<set>` on a paint property makes the icon multicolor and it is never rewritten, keeping the author's theming or animation intact. Forcing `mono` on such an icon is an error that names the reason.
- 0da4021: Publish `svgworm.schema.json`, the JSON Schema of `svgworm.config.json`, and export it as `svgworm/schema.json`. Add package READMEs and npm keywords. `pnpm schema:generate` regenerates the file, and a test fails when it is stale.
- d3be39d: `svgworm watch` is incremental: only icons whose content changed are re-optimized on a rebuild (about 10 ms for 1,000 unchanged icons), through an in-memory per-icon transform cache (ADR-0015). The plain reporter marks reused icons with `(cached)`, and the `icon` event gains `fromCache`. The programmatic API gains `createTransformCache()` and a `cache` option on `compile`, `build` and `compileFromDisk`. One-off builds and `check` never use a cache.
- b0c6239: Add `svgworm init`. On an interactive terminal it asks for the icon folder, the public path and what to write; otherwise flags answer everything (`--source`, `--public-path`, `--component-file`, `--no-component`, `--no-scripts`, `--agents-md`, `--yes`, `--json`). It writes `svgworm.config.json` with its `$schema`, adds `predev` and `prebuild` scripts that run `svgworm` (chaining before existing scripts), creates the `createIcon` wiring when `react` or `next` is a dependency, and can append a marked svgworm section to `AGENTS.md`. It never overwrites a file whose content differs, so re-running it is idempotent, and it prints the install and next-step commands for the detected package manager.
- eebb113: First working build: `svgworm` turns a folder of SVG files into a content-hashed sprite, a stack file for icons with `url(#...)` references, a manifest module, and types, following output contract v0.1. It adds the CLI (`--source`, `--out-dir`, `--public-path`, `--module-dir`, `--flatten`, `--json`), per-icon color classification, collision and invalid-SVG errors that write nothing, and stale-sprite cleanup. Exit codes are `0` built, `1` invalid input or I/O failure, `2` usage or config error. `@svgworm/react` is versioned together with `svgworm` and has no changes yet.

### Patch Changes

- a9aff9d: Hardening from the pre-release code and security review.
  
  - Validation rejects `<script>` and other embedding elements under any namespace prefix (`<x:script>` was accepted and reached the sprite), `<foreignObject>`, CSS-escaped `url()` references, `javascript:` with embedded whitespace, SMIL that retargets `href` or event handlers, and `data:` hrefs that are not raster images.
  - Output files are written through a temporary file and renamed into place: a reader never sees a half-written module, and a symlink at the output path is replaced instead of followed. Files whose bytes did not change are left untouched, so `svgworm watch` next to a dev server no longer triggers reloads for no-op saves.
  - `svgworm watch` attaches its watchers before the first build (edits during it are no longer lost), reports a failed watcher instead of going quiet, never rebuilds after Ctrl+C, and waits for a build in flight before exiting. Ctrl+C ends `build` and `check` at once again.
  - `svgworm init` refuses paths outside the project or containing quotes, backticks or line breaks, validates the config it is about to write with the same rules as `build`, keeps a custom `--config` in the scripts it adds, preserves `package.json` line endings and indentation after a blank line, keeps several `--source` folders in interactive mode, and never overwrites a file that appeared or changed while its prompts were open.
  - `svgworm check` reports read errors other than a missing file instead of listing the file as missing.
  - `@svgworm/react` forwards `id`, `data-*`, `aria-*` and other HTML attributes to the `img` and `mask` deliveries, and treats prototype keys such as `constructor` as unknown icons.
