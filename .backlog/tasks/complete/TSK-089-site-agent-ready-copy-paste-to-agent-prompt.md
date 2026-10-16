---
id: TSK-089
title: Site: agent-ready copy (paste-to-agent prompt, copy buttons, migration prompts)
status: complete
priority: P3
tags: []
created: 2026-10-15
source: idea/PLN-005
depends-on: []
started: 2026-10-15
completed: 2026-10-16
---

# Site: agent-ready copy (paste-to-agent prompt, copy buttons, migration prompts)

## Description

### Goal

Make the landing page ready for agents and easy to copy from, following the pattern rea.tools uses:

1. A "paste this into your coding agent" prompt in the hero, next to the install command.
2. A copy button on every command and prompt block on the landing page and in the docs.
3. Prompts for bigger jobs: migrating an app from `lucide-react` or `react-icons` to svgworm.
4. A Vite tab in the install switch, next to Next.js and Astro.

### Context

- Came from a review of rea.tools (2026-10-15). Its hero pairs a terminal command with a prompt to paste into an agent, and every block can be copied.
- `apps/site/src/components/Install.astro` deliberately has no copy button ("it would need client JS", TSK-049). AGENTS.md principle 1 now says the site may use client JS freely, so that reason no longer holds. Decided: add progressively enhanced JS, with no ADR.
- The agent section in `Landing.astro` (`#agents`) shows only the `npx skills add` commands. There is no plain prompt for agents without skills.
- Vite has docs (`content/docs/vite.md`) and an example (`examples/vite-react`), but the install switch offers only Next.js and Astro.
- TSK-088 (zero-config defaults) may change setup commands. The prompts point at `/llms.txt` and the framework docs instead of hardcoding CLI flags, so they don't go stale.
- Principle 10 (findable by AI agents).

### Approach

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

## Acceptance Criteria

- [x] Prompts live as data in apps/site/src/lib/prompts.ts and reference llms.txt or docs URLs, never CLI flags
- [x] Docs copy-button logic extracted into one shared script plus CopyBlock.astro; docs page uses it with no behavior change
- [x] Install.astro has a Vite tab, a copy button that copies the checked variant, and the stale client-JS comment removed
- [x] Hero shows one generic paste-into-your-agent prompt
- [x] #agents keeps skill commands and adds lucide-react and react-icons migration prompts
- [x] Each migration prompt passes an eval (evals/agent or by hand) or is dropped — evidence: by hand with the evals/agent method: claude -p, same limited tools, $3 cap, published svgworm, one Next.js 16 app per prompt with 8 icons → svgr, lucide-react and react-icons all pass (2026-10-16) (2026-10-16)
- [x] CSP still covers all inline scripts (built _headers hash count checked)
- [x] llms.txt and README in sync if a prompt is shared
- [x] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Implemented: prompts.ts, CopyButtons.astro (shared inline script, `[data-copy]` + `.prose pre`), copy styles moved to base.css, Vite tab, hero prompt, #agents migration prompts, #try copy names Vite. site:check passes (3 CSP hashes); checked 1280 and 360 widths. Migration-prompt eval NOT run (evals/agent has no migration mode, costs tokens). `pnpm lint` fails on a clean tree too (ESLint JSON parse), pre-existing.
- [2026-10-16] Migration prompts evaluated (2026-10-16). Pass criteria were fixed before the run: pnpm build and tsc --noEmit pass, evals/agent/check.mjs finds all 8 icons through the sprite in the prerendered page and no icon code in client chunks, the old package is gone from package.json, and no old import or SVGR config remains.
- [2026-10-16] Setup: three scratch Next.js 16 apps built from evals/agent/fixture, each using 8 icons (lucide-react 1.57.0, react-icons 5.7.0 across fa6/fi/hi/io5/md, and SVGR 8.1.0 through turbopack.rules with lucide-static SVG files). Each agent got only the prompt text from prompts.ts. It ran `claude -p` with the evals/agent tool set plus cp and mkdir, with a $3 budget and published svgworm.
- [2026-10-16] Results: svgr pass ($0.53, 22 turns, 87 s); lucide-react pass ($0.79, 32 turns, 131 s); react-icons pass ($1.29, 31 turns, 217 s). No prompt dropped. The scratch apps and runner are not committed, since evals/agent has no migration mode yet.
- [2026-10-16] Completed
