---
'svgworm': minor
---

Add `svgworm init`. On an interactive terminal it asks for the icon folder, the public path and what to write; otherwise flags answer everything (`--source`, `--public-path`, `--component-file`, `--no-component`, `--no-scripts`, `--agents-md`, `--yes`, `--json`). It writes `svgworm.config.json` with its `$schema`, adds `predev` and `prebuild` scripts that run `svgworm` (chaining before existing scripts), creates the `createIcon` wiring when `react` or `next` is a dependency, and can append a marked svgworm section to `AGENTS.md`. It never overwrites a file whose content differs, so re-running it is idempotent, and it prints the install and next-step commands for the detected package manager.
