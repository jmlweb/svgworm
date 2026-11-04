---
id: TSK-104
title: Site: end-to-end worked example (one icon traced from SVG to render)
status: complete
priority: P2
tags: [site]
created: 2026-10-31
source: idea/PLN-006
depends-on: []
started: 2026-11-03
completed: 2026-11-03
---

# Site: end-to-end worked example (one icon traced from SVG to render)

## Description

From PLN-006. Trace the `terminal` icon from `apps/site/icons/terminal.svg` to its `<symbol>` in the hashed sprite, its manifest entry, and `<Icon name="terminal" />` with its markup. It replaces the `#demo` section (`apps/site/src/components/Landing.astro:222`). It adds nothing the landing page already shows: no CLI output, no TS error, no comparison.

Files: `apps/site/src/components/WorkedExample.astro` (new), `apps/site/src/components/Landing.astro`, a helper in `apps/site/src/lib/`, `apps/site/src/styles/landing.css`, a test in `apps/site/tests/`. `apps/site` only, so no changeset (LRN-035). The idea's sequencing risk with TSK-089 is gone: TSK-089 is complete.

## Acceptance Criteria

- [x] The raw icons/terminal.svg, its <symbol> from the built sprite (found by its manifest id) and manifest.icons.terminal are read at build time in the Astro frontmatter, never hand-copied
- [x] A new WorkedExample.astro shows numbered steps, each labeled "svgworm generates" or "you write", with a one-line lede; long blocks fold in <details> with no JS; the last step reuses terminal and terminalComment from #why
- [x] The worked example replaces #demo in Landing.astro, so the section count stays flat
- [x] A vitest in apps/site/tests/ checks that the shown SVG, symbol and manifest snippets match the committed files
- [x] pnpm site:check passes, and the page was checked in light and dark at phone and desktop widths

## Notes

## Learnings

- LRN-063: Astro components in site vitests must be imported dynamically for type-aware lint
## Progress Log

- [2026-10-31] Created
- [2026-11-03] Started
- [2026-11-03] criterion 1 — evidence: src/lib/worked-example.ts traceIcon reads icons/terminal.svg, the sprite at manifest.sprites[...].sprite.url and manifest.icons.terminal with node:fs at build time; the symbol is extracted by its manifest id; pnpm site:check → passes (2026-11-03)
- [2026-11-03] criterion 2 — evidence: src/components/WorkedExample.astro, 4 numbered steps labeled you write / svgworm generates / svgworm generates / you write, one-line lede each, raw SVG folded in <details>, last step uses the terminalComment prop from Landing; vitest tests/worked-example.test.ts (labels, <details>, no <script>) → 6 passed (2026-11-03)
- [2026-11-03] criterion 3 — evidence: Landing.astro renders <WorkedExample /> where the #demo section was (same id and section-raised class), demo code and CSS removed; section count unchanged (2026-11-03)
- [2026-11-03] criterion 4 — evidence: apps/site/tests/worked-example.test.ts reads the committed files itself and compares the rendered code blocks; failed before the component existed, now pnpm --filter svgworm-site test → 60 passed (2026-11-03)
- [2026-11-03] criterion 5 — evidence: pnpm site:check → exit 0 (23 icons from the hashed sprite); Playwright Chromium screenshots of the section from astro preview at 375 px and 1280 px in light and dark color schemes, reviewed: 2x2 grid on desktop, single column on phone, labels and code readable in both schemes (2026-11-03)
- [2026-11-03] Completed