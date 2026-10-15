---
'svgworm': minor
---

New `name/case-folded` warning (ADR-0021). A file or folder name with a lowercase letter followed by an uppercase one, such as Figma's `ArrowLeft.svg`, still becomes `arrowleft`: letter case is never split, because git and case-insensitive file systems do not keep case-only renames. The build now says so and suggests the file name that gives a readable name (`arrow-left.svg`). Names and output do not change; `--json` lists the warning in `warnings`.
