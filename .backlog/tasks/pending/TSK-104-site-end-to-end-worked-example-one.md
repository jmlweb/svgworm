---
id: TSK-104
title: Site: end-to-end worked example (one icon traced from SVG to render)
status: pending
priority: P2
tags: [site]
created: 2026-10-31
source: idea/PLN-006
depends-on: []
---

# Site: end-to-end worked example (one icon traced from SVG to render)

## Description

From PLN-006. Trace the `terminal` icon from `apps/site/icons/terminal.svg` to its `<symbol>` in the hashed sprite, its manifest entry, and `<Icon name="terminal" />` with its markup. It replaces the `#demo` section (`apps/site/src/components/Landing.astro:222`). It adds nothing the landing page already shows: no CLI output, no TS error, no comparison.

Files: `apps/site/src/components/WorkedExample.astro` (new), `apps/site/src/components/Landing.astro`, a helper in `apps/site/src/lib/`, `apps/site/src/styles/landing.css`, a test in `apps/site/tests/`. `apps/site` only, so no changeset (LRN-035). The idea's sequencing risk with TSK-089 is gone: TSK-089 is complete.

## Acceptance Criteria

- [ ] The raw icons/terminal.svg, its <symbol> from the built sprite (found by its manifest id) and manifest.icons.terminal are read at build time in the Astro frontmatter, never hand-copied
- [ ] A new WorkedExample.astro shows numbered steps, each labeled "svgworm generates" or "you write", with a one-line lede; long blocks fold in <details> with no JS; the last step reuses terminal and terminalComment from #why
- [ ] The worked example replaces #demo in Landing.astro, so the section count stays flat
- [ ] A vitest in apps/site/tests/ checks that the shown SVG, symbol and manifest snippets match the committed files
- [ ] pnpm site:check passes, and the page was checked in light and dark at phone and desktop widths

## Notes

## Learnings

## Progress Log

- [2026-10-31] Created