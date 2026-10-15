---
id: PLN-005
title: Site: agent-ready copy (paste-to-agent prompt, copy buttons, migration prompts)
status: approved
created: 2026-10-15
complexity: low
reviewed: 2026-10-15
task-id: TSK-089
---

## Goal

Make the landing page ready for agents and easy to copy from, following the pattern rea.tools uses:

1. A "paste this into your coding agent" prompt in the hero, next to the install command.
2. A copy button on every command and prompt block on the landing page and in the docs.
3. Prompts for bigger jobs: migrating an app from `lucide-react` or `react-icons` to svgworm.
4. A Vite tab in the install switch, next to Next.js and Astro.

## Context

- Came from a review of rea.tools (2026-10-15). Its hero pairs a terminal command with a prompt to paste into an agent, and every block can be copied.
- `apps/site/src/components/Install.astro` deliberately has no copy button ("it would need client JS", TSK-049). AGENTS.md principle 1 now says the site may use client JS freely, so that reason no longer holds. Decided: add progressively enhanced JS, with no ADR.
- The agent section in `Landing.astro` (`#agents`) shows only the `npx skills add` commands. There is no plain prompt for agents without skills.
- Vite has docs (`content/docs/vite.md`) and an example (`examples/vite-react`), but the install switch offers only Next.js and Astro.
- TSK-088 (zero-config defaults) may change setup commands. The prompts point at `/llms.txt` and the framework docs instead of hardcoding CLI flags, so they don't go stale.
- Principle 10 (findable by AI agents).

## Approach

1. Write the prompts as data in one module (`apps/site/src/lib/prompts.ts`): one generic setup prompt for the hero, plus migration from `lucide-react` and from `react-icons`. Each prompt references `https://svgworm.com/llms.txt` or a docs URL, never flags.
2. Extract the docs copy-button logic from `apps/site/src/pages/docs/[slug].astro` (lines ~172-198: `<template id="copy-button">`, `navigator.clipboard`, the "Press Ctrl+C" fallback) into one shared script plus a `CopyBlock.astro` component. Reuse the `#copy-button` markup and the `copy` icon. Pick one shared selector or data attribute, since the docs use `.prose pre` and the landing page uses `pre.code` regions. Without JS, blocks stay selectable as they are today.
3. In `Install.astro`, use `CopyBlock`, add the Vite radio and command, and remove the stale "would need client JS" comment (the landing page already ships the worm pause script). The button copies the checked variant, not a fixed one.
4. In the hero, add one generic "Paste into your agent" prompt that tells the agent to detect the framework.
5. In `#agents`, keep the skill commands and add a "Migrating?" sub-block with the two migration prompts.
6. Switch the docs page to the shared script, with no new behavior.
7. Run each migration prompt through `evals/agent/` (or by hand on a sample app) before publishing. Drop a prompt that fails.
8. Confirm the CSP still covers the scripts: `public/_headers` allows scripts by SHA-256 hash only, and `scripts/csp-headers.mjs` hashes the inline `<script>` elements of the built HTML. Keep the script inline (Astro-processed), never an external file or an inline handler.
9. Keep `llms.txt` and the README in sync if a prompt appears there too (the AGENTS.md sync rule).
10. Run `pnpm site:check` and check the built `_headers` hash count.

## Files to Modify

- `apps/site/src/lib/prompts.ts` — new: prompt texts as data
- `apps/site/src/components/CopyBlock.astro` — new: copyable block, markup from the docs `#copy-button` template
- `apps/site/src/lib/` — new shared copy-button script, extracted from `pages/docs/[slug].astro`
- `apps/site/src/components/Install.astro` — Vite tab, copy button, stale comment removed
- `apps/site/src/components/Landing.astro` — hero agent prompt, migration prompts in `#agents`
- `apps/site/src/pages/docs/[slug].astro` — use the shared copy-button script
- `apps/site/src/styles/landing.css`, `apps/site/src/styles/docs.css` — button and prompt styles
- `llms.txt` — only if a prompt is shared with it

## Risks & Considerations

- Migration prompts promise a workflow nobody has tested yet (step 7 gates them).
- CSP: scripts are allowed by hash only. A non-inline script or an inline handler breaks silently in production; step 8 checks it.
- Clipboard API needs a secure context. The site is HTTPS, and localhost also counts as secure.
- The CSS-only radio switch and a copy button that must copy the visible variant: the script reads the checked radio's block, not a fixed one.
- Keep the button accessible: a real `<button>`, a visible focus ring, and a live region for feedback.

## Revision History
- [2026-10-15] Reuse the existing docs copy-button script instead of writing a new one; docs step becomes a refactor; add CSP hash check and a migration-prompt eval step; remove (not reword) the stale Install.astro comment; Open Question decided: one generic hero prompt.
