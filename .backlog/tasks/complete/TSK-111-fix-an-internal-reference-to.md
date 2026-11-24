---
id: TSK-111
title: Fix: An internal reference to an id the icon does not define builds silently and the icon renders blank
status: complete
priority: P3
tags: []
created: 2026-11-21
source: report/RPT-017
depends-on: []
started: 2026-11-24
completed: 2026-11-24
---

# Fix: An internal reference to an id the icon does not define builds silently and the icon renders blank

## Description

From RPT-017. `renameIds` (`packages/svgworm/src/core/svg/ids.ts:42`) keeps a reference to an undefined id verbatim, and `validateTree` (`packages/svgworm/src/core/svg/validate.ts:114`) has no check that internal `#id` targets exist. The icon builds with exit 0 and renders blank. Principle 5 says invalid SVGs fail loudly.

Decide error vs warning in the task (principle 5 points to error). Change touches `src/core`: run the full core gate set from `.claude/rules/agent-workflow.md`.

## Acceptance Criteria

- [x] A failing test first reproduces a dangling <use href="#missing"> and a dangling fill="url(#grad)" building with ok: true and no diagnostic
- [x] transformIcon reports a diagnostic naming the file, the element and the missing id for href/xlink:href, url(#…) in attributes and style, and SMIL begin/end id references
- [x] The fixture set and output snapshots stay unchanged for valid icons; pnpm verify, pnpm determinism:fingerprint and the example, site and render checks pass
- [x] The diagnostic code and its severity are documented in the CLI/config docs, llms.txt if listed there, and a changeset records the user-facing change

## Notes

## Learnings

- LRN-071: Dangling internal id references are checked on the raw tree, before svgo
## Progress Log

- [2026-11-21] Created
- [2026-11-24] Started
- [2026-11-24] criterion 1 — evidence: new tests in transform.test.ts (6 dangling cases) and compile.test.ts (danglingref.svg + danglingfill.svg) failed before the fix with ok: true and no diagnostic (vitest: 6 failed in transform.test.ts; compile 'expected true to be false') (2026-11-24)
- [2026-11-24] criterion 2 — evidence: pnpm exec vitest run src/core/svg/transform.test.ts → 20 passed; new error svg/missing-reference (DiagnosticCode.MISSING_REFERENCE) names file, element and missing id for href, xlink:href, url(#…) in attributes, style attribute and <style>, and SMIL begin/end; valid forward references and clock values still pass (2026-11-24)
- [2026-11-24] criterion 3 — evidence: pnpm verify → exit 0 (951 passed, no snapshot changed); pnpm determinism:fingerprint → byte-identical to main (cmp); pnpm example:check, example:vite:check, site:check → exit 0; pnpm render:check → chromium 57 pass/0 fail, firefox 57 pass/0 fail, WebKit not launchable on this host (missing system libs), matrix.json unchanged and sprites identical so CI WebKit result cannot change (2026-11-24)
- [2026-11-24] criterion 4 — evidence: svg/missing-reference (error) added to apps/site/src/content/docs/troubleshooting.md and both skills' error tables; llms.txt lists no codes (links to troubleshooting) so unchanged; .changeset/missing-internal-reference.md (svgworm minor) (2026-11-24)
- [2026-11-24] Completed