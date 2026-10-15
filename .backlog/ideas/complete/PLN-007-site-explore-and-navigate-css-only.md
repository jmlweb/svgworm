---
id: PLN-007
title: Site: explore and navigate (CSS-only color demo, guide cards, help row)
status: approved
created: 2026-10-15
complexity: medium
reviewed: 2026-10-15
task-id: TSK-090
---

## Goal

Help visitors find their next step, following rea.tools' target-guide and help-link cards. Scope: guide cards and a help row (the color demo already exists).

1. Cards for the framework guides and examples: Next.js, Vite and Astro, each linking to its docs page and its example (`examples/next-app-router`, `examples/vite-react`, `apps/site` for Astro).
2. A help row before the footer: Docs, Troubleshooting, GitHub issues, GitHub Discussions.

## Context

- Came from the rea.tools review (2026-10-15).
- The interactive color demo this idea first proposed already exists: `#proof` in `Landing.astro` has a CSS-only `color-demo` (`fieldset.swatches`, `swatchStyle`) where mono icons follow the picked color and the multicolor snail keeps its own, and the showcase already splits "Multicolor, colors kept" from "Mono, follow currentColor". Dropped from scope.
- GitHub Discussions is enabled on `jmlweb/svgworm` (`gh repo view --json hasDiscussionsEnabled` → true).
- The `#try` CTA says "One `init`, Next.js or Astro", which leaves out Vite. PLN-005 adds a Vite install tab; whichever lands second checks the other.
- Docs pages exist for each framework (`content/docs/nextjs.md`, `vite.md`, `astro.md`) and for `troubleshooting.md`.
- No showcase cards for real adopters yet: only add them when real users exist (no placeholders).

## Approach

1. `GuideCards.astro`: three cards, each with an icon from the sprite, one line on what is special (RSC zero-JS, Vite `base`, Astro `Icon.astro`), and links to the docs page and the example directory on GitHub.
2. `HelpRow.astro`: link rows for Docs, Troubleshooting, GitHub issues and GitHub Discussions.
3. Mount them in `Landing.astro`: the guide cards after `#start`, the help row after `#try` and before `SiteFooter`.
4. Update the `#try` CTA copy to name Vite; coordinate with PLN-005's Vite install tab.
5. Verify the example links: check in `scripts/check-output.mjs` that each linked example path exists in the repo, or link to docs pages only.
6. Run `pnpm site:check`; check keyboard focus, light/dark, and phone width.

## Files to Modify

- `apps/site/src/components/GuideCards.astro` — new: framework guide + example cards
- `apps/site/src/components/HelpRow.astro` — new: help links
- `apps/site/src/components/Landing.astro` — mount both; CTA copy names Vite
- `apps/site/src/styles/landing.css` — card and help row styles
- `apps/site/scripts/check-output.mjs` — example links resolve (if kept)

## Risks & Considerations

- Too many sections: keep the cards one row on desktop and the help row compact.
- `site:check` asserts every icon comes from the hashed sprite; card icons must use `Icon.astro`, never inline SVG.
- Example links to GitHub rot if a folder is renamed; step 5 guards it.
- Overlap with PLN-005 on the Vite wording.

## Revision History
- [2026-10-15] Dropped the color demo (already in `#proof`); Discussions confirmed enabled; added CTA Vite copy (coordinate with PLN-005) and an example-link check; removed the CSS-variable theming question. Effective complexity is low: propose P3 at approval. Frontmatter title still names the color demo; the body scope wins.
