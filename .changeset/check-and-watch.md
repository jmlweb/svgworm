---
'svgworm': minor
---

Add `svgworm check` and `svgworm watch`. `check` compiles the icons, compares the result with the files on disk without writing, lists each missing, changed or stale file plus the icon names added or removed, and exits `1` when the committed output is stale (`0` when up to date). `watch` builds once and rebuilds everything after each change in a source folder, until Ctrl+C. Both take the same flags as `build`, including `--json`. The programmatic API gains `check`, `watch` and `compileFromDisk`.
