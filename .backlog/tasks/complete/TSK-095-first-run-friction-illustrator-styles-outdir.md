---
id: TSK-095
title: First-run friction: Illustrator styles, outDir hint, 80-column components, React 19 docs
status: complete
priority: P1
tags: [dx, init, svgo, docs]
created: 2026-10-15
source: RPT-007
depends-on: []
completed: 2026-10-15
started: 2026-10-15
---

# First-run friction: Illustrator styles, outDir hint, 80-column components, React 19 docs

## Description

Fix the four first-run problems found migrating Enterwell/react-starter (RPT-007).

## Acceptance Criteria

- [x] Unused <style> rules (Illustrator .stN classes) are dropped instead of failing; a real leftover lists its selectors — evidence: optimize.test.ts: drops unmatched rules, names .a:hover; minifyStyles runs before inlineStyles so @media variants of inlined classes still fail (fixture style/unscopable-media) (2026-10-15)
- [x] outDir-inside-source error names the fix — evidence: resolve.test.ts expects --out-dir hint (2026-10-15)
- [x] Generated icon.tsx, Icon.astro and SvgwormLoader.astro fit in 80 columns, with a test — evidence: plan.test.ts: 80-column test over next, react, astro, cdn variants (2026-10-15)
- [x] React 19 requirement stated in nextjs.md, vite.md, README, llms.txt and the @svgworm/react README — evidence: docs edited; troubleshooting entries added (2026-10-15)
- [x] Output bytes unchanged on fixtures and a real folder; verify and checks pass — evidence: contract snapshots unchanged; supabase docs sprite 283186 B raw before and after; verify, ts7, determinism, examples, render:check exit 0 (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Also completed the CSS named color table (148, from svgo 4.1.0): minifyStyles spells hex as shorter names (tan, peru), and the classifier knew only 31. Regenerated apps/site Icon.astro from the current template, so the conformance test now covers today's template (narrows RPT-008). Changeset: .changeset/first-run-friction.md.
- [2026-10-15] Completed