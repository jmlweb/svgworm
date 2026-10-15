---
id: TSK-041
title: Fix: transformIcon reports internal failures as INVALID_XML against the user's file
status: pending
priority: P3
tags: []
created: 2026-10-15
source: report/RPT-001
depends-on: []
---

# Fix: transformIcon reports internal failures as INVALID_XML against the user's file

## Description

### Summary
The outer `catch` in `transformIcon` (`packages/svgworm/src/core/svg/transform.ts:180-187`) turns every exception into an `INVALID_XML` diagnostic on the icon being processed. A svgworm bug looks like a broken user SVG, against principle 5 (fail loudly).

### Key details
- The catch-all dates from the first commit (`cfa50cc`). It also hides `throw new Error('svgo did not run the transform')` from `core/svg/tree.ts:72`.
- `cli/commands/build.ts:49` already reports a thrown error as `unexpected failure: …` with exit 1, so the CLI needs no change.
- Risk: svgo plugins in `normalizeStyles` / `optimizeMarkup` can throw on odd CSS in valid XML. Wrap those calls narrowly so that input stays a diagnostic.
- Option: a distinct internal-error diagnostic code instead of a throw. That changes the public `DiagnosticCode` set, so it needs a changeset.

Source: RPT-001.

## Acceptance Criteria

- [ ] An internal failure in the per-icon pipeline (pipeline bug, svgo did not run the transform) is no longer reported as svg/invalid-xml; it throws and the CLI reports an unexpected failure
- [ ] svgo parse or optimize errors on user input still come back as diagnostics on the icon file
- [ ] Tests cover both cases, written first

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created