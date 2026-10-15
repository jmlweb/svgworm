---
id: RPT-001
title: transformIcon reports internal failures as INVALID_XML against the user's file
type: improvement
severity: medium
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-041
---

## Summary
The outer `catch` in `transformIcon` turns every exception into an `INVALID_XML` diagnostic on the icon being processed. A svgworm bug looks like a broken user SVG.

## Details
`packages/svgworm/src/core/svg/transform.ts:180-187` catches everything in the per-icon pipeline. That includes the expected svgo parse errors, but also a `TypeError` from a pipeline bug and the explicit `throw new Error('svgo did not run the transform')` in `core/svg/tree.ts:72`. All of them surface as `[invalid-xml] icons/foo.svg: <message>`.

This works against principle 5 (fail loudly and early). A user is told to fix an icon that is valid, and the bug never reaches us as a crash with a stack trace.

## Current behavior
Any exception inside `transformIcon` becomes `{ code: INVALID_XML, file, message }`, and the build exits 1 as if the input were invalid.

## Proposed change
Catch only where svgo parses or optimizes user input (`parseSvgTree` already returns a result; wrap `normalizeStyles` / `optimizeMarkup` / `mutateSvgTree` narrowly). Let everything else throw, so the CLI reports it as an unexpected failure. Alternatively, add a distinct `INTERNAL_ERROR` code that names svgworm, not the file, as the culprit. Start with a test that injects a throwing step and expects it not to be reported as `INVALID_XML`.

## Expected benefit
Real bugs get reported as bugs. Users don't waste time on icons that are fine.
