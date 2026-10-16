---
id: TSK-090
title: Site: framework guide cards and help links
status: complete
priority: P3
tags: []
created: 2026-10-15
source: idea/PLN-007
depends-on: []
started: 2026-10-15
completed: 2026-10-16
---

# Site: framework guide cards and help links

## Description

### Goal

Help visitors find their next step, following rea.tools' target-guide and help-link cards. Scope: guide cards and a help row (the color demo already exists).

1. Cards for the framework guides and examples: Next.js, Vite and Astro, each linking to its docs page and its example (`examples/next-app-router`, `examples/vite-react`, `apps/site` for Astro).
2. A help row before the footer: Docs, Troubleshooting, GitHub issues, GitHub Discussions.

### Context

- Came from the rea.tools review (2026-10-15).
- The interactive color demo this idea first proposed already exists: `#proof` in `Landing.astro` has a CSS-only `color-demo` (`fieldset.swatches`, `swatchStyle`) where mono icons follow the picked color and the multicolor snail keeps its own, and the showcase already splits "Multicolor, colors kept" from "Mono, follow currentColor". Dropped from scope.
- GitHub Discussions is enabled on `jmlweb/svgworm` (`gh repo view --json hasDiscussionsEnabled` → true).
- The `#try` CTA says "One `init`, Next.js or Astro", which leaves out Vite. PLN-005 adds a Vite install tab; whichever lands second checks the other.
- Docs pages exist for each framework (`content/docs/nextjs.md`, `vite.md`, `astro.md`) and for `troubleshooting.md`.
- No showcase cards for real adopters yet: only add them when real users exist (no placeholders).

### Approach

1. `GuideCards.astro`: three cards, each with an icon from the sprite, one line on what is special (RSC zero-JS, Vite `base`, Astro `Icon.astro`), and links to the docs page and the example directory on GitHub.
2. `HelpRow.astro`: link rows for Docs, Troubleshooting, GitHub issues and GitHub Discussions.
3. Mount them in `Landing.astro`: the guide cards after `#start`, the help row after `#try` and before `SiteFooter`.
4. Update the `#try` CTA copy to name Vite; coordinate with PLN-005's Vite install tab.
5. Verify the example links: check in `scripts/check-output.mjs` that each linked example path exists in the repo, or link to docs pages only.
6. Run `pnpm site:check`; check keyboard focus, light/dark, and phone width.

### Adjustments at approval (2026-10-15)

- Help links (Troubleshooting, GitHub issues, GitHub Discussions) go in `SiteFooter.astro`, not a new `HelpRow` section: the footer already links npm, CLI, Config, Output contract, Decisions and llms.txt.
- The Astro card links `astro.md`; link `apps/site` only if labeled "this site".
- Sequence after TSK-089 (shared `Landing.astro`, Vite wording) and coordinate with PLN-006 (`landing.css`).

## Acceptance Criteria

- [x] GuideCards.astro shows Next.js, Vite and Astro cards with a sprite icon, one line each, and links to the docs page (and example where one exists)
- [x] Astro card links astro.md; apps/site linked only if labeled this site
- [x] Cards mounted after #start, one row on desktop
- [x] SiteFooter links Troubleshooting, GitHub issues and GitHub Discussions; no new HelpRow section
- [x] #try CTA copy names Vite, consistent with TSK-089
- [x] Linked example paths are verified (check-output.mjs) or only docs pages are linked
- [x] pnpm site:check passes; keyboard focus, light/dark and phone width checked — evidence: pnpm site:check → exit 0 (3 CSP hashes); Playwright Chromium on the built site: 360 and 1280 px, light and dark, no horizontal overflow, cards in one row at 1280 and stacked at 360; Tab reaches every card and footer link with a 2px outline (light rgb(147,58,67), dark rgb(222,143,138)); screenshots read by eye (2026-10-16) (2026-10-16)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Added GuideCards.astro (after #start), footer help links, example-path check in check-output.mjs; #try CTA already named Vite. site:check passes. Left: visual check (focus, light/dark, phone).
- [2026-10-16] Visual check done after the hero, og-image and colors-tile commits. Placement note: da483ce (2026-10-15, moving #agents after Why svgworm) moved #start below #proof, so GuideCards now sits after #agents and before #proof, not after #start as criterion 3 says. Left as is, because the reorder is the maintainer's later decision; move <GuideCards /> after #start if that was not intended.
- [2026-10-16] Completed
- [2026-10-16] Moved <GuideCards /> after #start, as criterion 3 says (maintainer confirmed). site:check passes.
