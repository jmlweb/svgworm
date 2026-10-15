---
'svgworm': patch
---

`svgworm` with no `svgworm.config.json` and no `--source` now says what to do (run `svgworm init` or pass `--source <dir>`) instead of showing the validation issue for a missing `sources` field. When a config exists in a parent folder, the message names it, so running from a subdirectory of a project is no longer a puzzle. Exit code 2 is unchanged.
