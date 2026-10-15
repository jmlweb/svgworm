---
id: PLN-006
title: Site: end-to-end worked example (one icon traced from SVG to render)
status: pending
created: 2026-10-15
complexity: medium
---

## Goal

Show svgworm working on one real icon, end to end, the way rea.tools walks one feature from prompt to code. Only add what the landing page does not already show:

1. Trace `terminal` from this site's `icons/`: raw `terminal.svg` → its `<symbol>` in the hashed sprite → its manifest entry → `<Icon name="terminal" />` and the markup it renders.
2. Label each step of the trace "svgworm generates" or "you write", so the trace shows who writes what without a separate panel.

## Context

- Came from the rea.tools review (2026-10-15).
- The landing page already shows: build output in the hero terminal (`Landing.astro:157-163`, derived from the manifest, no `time` row); the misspelled-name `TS2322` error three times (hero `:166`, `#demo` `:227`, `#why` tile `:295`); `<Icon name="terminal" />` with its generated markup (`terminalComment`) in `#why`; the comparison with lucide-react and SVGR, with measured bytes and a link to the method (`#why` ledes, `:257-271`); and what the user writes to get started (`#start`, `:342`). This idea adds none of those again.
- `#demo` shows three stages (files, sprite + type, render) but no single icon all the way through: no raw SVG, no `<symbol>`, no manifest entry.
- The site consumes its own committed output (`apps/site/svgworm/manifest.json`, `icons.js`, `icons.d.ts`, the hashed sprite in `public/icons/`). `Landing.astro` already imports `manifest` from `../../svgworm/icons.js`, and `pages/index.astro` reads the sprite size. `pnpm site:check` fails when the output is stale.

## Approach

1. Read `icons/terminal.svg`, the `terminal` `<symbol>` from the built sprite, and `manifest.icons.terminal` at build time in the Astro frontmatter (`node:fs` plus the existing `manifest` import). Never hand-copy them.
2. Build `WorkedExample.astro`: numbered steps, each labeled "svgworm generates" or "you write", a one-line lede each, code blocks; long blocks fold in `<details>` (no JS). The last step reuses `terminal` and `terminalComment` from `#why`.
3. Replace `#demo` with the worked example, so the section count and page length stay flat.
4. Add a vitest in `apps/site/tests/` (next to `icon-conformance.test.ts`) that the shown SVG, symbol and manifest snippets match the committed files.
5. Run `pnpm site:check`, and check light/dark and phone width.

## Files to Modify

- `apps/site/src/components/WorkedExample.astro` — new: the step-by-step trace
- `apps/site/src/components/Landing.astro` — replace `#demo`
- `apps/site/src/lib/` — helper to read the raw SVG and extract the `<symbol>` at build time
- `apps/site/src/styles/landing.css` — trace steps and step labels
- `apps/site/tests/` — snippets match the committed files

## Risks & Considerations

- The landing page already has the TS error three times, CLI output in the hero, the comparison in `#why` and the user's code in `#start`. Don't add more.
- Page length: fold long code in `<details>` and keep each lede to one line.
- Extracting a `<symbol>` from the sprite by regex is fragile; read it by its manifest `id`, and let the snippet test catch drift.
- TSK-089 also edits `Landing.astro` and `landing.css`. Do the two tasks one after the other, not in parallel.
- Comparison cards are out of scope. If wanted later, they replace the two comparison ledes in `#why` (a separate task), never add to them.

## Revision History
- [2026-10-15] Scoped down after audit: dropped CLI-output capture (hero already shows it; plain reporter `time` row is non-deterministic) and the annotated d.ts/TS error (already ×3 on the page); decided to replace `#demo`; reuse `terminal`/`terminalComment`; added a snippet-match test.
- [2026-10-15] Dropped ComparisonCards (duplicates the `#why` comparison) and the separate split panel (overlaps `#start`); steps now carry "generates / you write" labels; snippet test placed in `apps/site/tests/`; added a sequencing risk with TSK-089.
