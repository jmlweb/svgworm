---
'svgworm': minor
---

The plain (non-TTY) output of `svgworm`, `svgworm check` and `svgworm watch` no longer prints one `icon <name> <color> <delivery>` line per icon. With a large set that was thousands of lines in every CI or `predev` run. It still lists the files written or removed, the warnings and errors, and the summary; `check` prints only its verdict when the output is up to date. Pass the new `--verbose` flag to get the per-icon lines back. `--json` output is unchanged and still includes every icon.
