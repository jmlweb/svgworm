---
id: TSK-069
title: Copy button on docs code blocks
status: complete
priority: P3
tags: [site, docs, ux]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Copy button on docs code blocks

## Description

From the 2026-10-15 docs design critique. No docs code block has a copy affordance, and the docs are built to be copied from (principle 10). Principle 1 binds the generated output, not the site, so a small inline script is allowed, but only on `/docs/*` pages: the landing page stays at 0 B of JS (see TSK-049).

## Acceptance Criteria

- [x] Every pre on /docs/* pages has a copy button — evidence: Playwright on /docs/cli/ with JS: 4 pre, 4 .copy-button (one per pre); the docs page script clones a <template> with the sprite icon (2026-10-15)
- [x] The button is keyboard-reachable, has an accessible name and announces the copy — evidence: button element, aria-label Copy code, Enter copies (clipboard read back), label and aria-label change to Copied for 2 s; focus-visible ring (2026-10-15)
- [x] It works in light and dark themes — evidence: colors come from the terminal tokens (--term-ink, --worm) used in both themes; screenshot in light reviewed (2026-10-15)
- [x] Without JS the button is hidden — evidence: Playwright with JavaScript disabled: 0 buttons (the script adds them) (2026-10-15)
- [x] The landing page still ships 0 B of JavaScript — evidence: dist/_astro has no .js and index.html has no <script src>; the one inline script is the pre-existing worm pause (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] pnpm site:check passed (23 icons, copy icon added from Lucide). The docs script is inlined by Astro as one module on docs pages only.
- [2026-10-15] Completed