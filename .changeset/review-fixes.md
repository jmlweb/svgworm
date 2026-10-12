---
'svgworm': patch
'@svgworm/react': patch
---

Hardening from the pre-release code and security review.

- Validation rejects `<script>` and other embedding elements under any namespace prefix (`<x:script>` was accepted and reached the sprite), `<foreignObject>`, CSS-escaped `url()` references, `javascript:` with embedded whitespace, SMIL that retargets `href` or event handlers, and `data:` hrefs that are not raster images.
- Output files are written through a temporary file and renamed into place: a reader never sees a half-written module, and a symlink at the output path is replaced instead of followed. Files whose bytes did not change are left untouched, so `svgworm watch` next to a dev server no longer triggers reloads for no-op saves.
- `svgworm watch` attaches its watchers before the first build (edits during it are no longer lost), reports a failed watcher instead of going quiet, never rebuilds after Ctrl+C, and waits for a build in flight before exiting. Ctrl+C ends `build` and `check` at once again.
- `svgworm init` refuses paths outside the project or containing quotes, backticks or line breaks, validates the config it is about to write with the same rules as `build`, keeps a custom `--config` in the scripts it adds, preserves `package.json` line endings and indentation after a blank line, keeps several `--source` folders in interactive mode, and never overwrites a file that appeared or changed while its prompts were open.
- `svgworm check` reports read errors other than a missing file instead of listing the file as missing.
- `@svgworm/react` forwards `id`, `data-*`, `aria-*` and other HTML attributes to the `img` and `mask` deliveries, and treats prototype keys such as `constructor` as unknown icons.
