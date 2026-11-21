---
id: TSK-111
title: Fix: An internal reference to an id the icon does not define builds silently and the icon renders blank
status: pending
priority: P3
tags: []
created: 2026-11-21
source: report/RPT-017
depends-on: []
---

# Fix: An internal reference to an id the icon does not define builds silently and the icon renders blank

## Description

From RPT-017. `renameIds` (`packages/svgworm/src/core/svg/ids.ts:42`) keeps a reference to an undefined id verbatim, and `validateTree` (`packages/svgworm/src/core/svg/validate.ts:114`) has no check that internal `#id` targets exist. The icon builds with exit 0 and renders blank. Principle 5 says invalid SVGs fail loudly.

Decide error vs warning in the task (principle 5 points to error). Change touches `src/core`: run the full core gate set from `.claude/rules/agent-workflow.md`.

## Acceptance Criteria

- [ ] A failing test first reproduces a dangling <use href="#missing"> and a dangling fill="url(#grad)" building with ok: true and no diagnostic
- [ ] transformIcon reports a diagnostic naming the file, the element and the missing id for href/xlink:href, url(#…) in attributes and style, and SMIL begin/end id references
- [ ] The fixture set and output snapshots stay unchanged for valid icons; pnpm verify, pnpm determinism:fingerprint and the example, site and render checks pass
- [ ] The diagnostic code and its severity are documented in the CLI/config docs, llms.txt if listed there, and a changeset records the user-facing change

## Notes

## Learnings

## Progress Log

- [2026-11-21] Created