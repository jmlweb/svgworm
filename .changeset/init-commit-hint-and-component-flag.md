---
'svgworm': patch
---

`svgworm init` ends its next steps with what to commit: `public/icons/` and `svgworm/` plus `svgworm check` in CI, or both folders in `.gitignore` with the scripts that run svgworm. `--component` (write the Icon wiring even when no framework dependency is found) now appears in `--help`, since an init hint already told users to pass it.
