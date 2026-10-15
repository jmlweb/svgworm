---
id: RPT-006
title: Icons render shifted or top-aligned through <use> when the viewBox does not start at 0 0 or the icon is not square
type: bug
severity: high
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-094
---

## Summary

The `use` delivery form misrenders real-world icons in Chromium, Firefox and WebKit alike. An icon whose `viewBox` origin is not `0 0` renders shifted and clipped. Some non-square icons (cal.com 3x2 flags) render top-aligned instead of centered. The committed fixtures are all square with a `0 0` origin, so `pnpm render:check` passes and CI never saw it. `@svgworm/react` renders exactly the failing markup (`<svg viewBox={icon.viewBox}><use href/></svg>`, `packages/react/src/create-icon.tsx:189`), and the Astro `Icon.astro` template must match it, so real users get it.

Found on 2026-10-16 while checking the real-world-sprite-numbers post (TSK-030). That post and the Reddit/Show HN launch kit in `docs/outreach/launch.md` are on hold until this is fixed and released.

## Details

Failing cells per folder in Chromium (Firefox and WebKit give the same list):

- supabase/supabase `apps/docs/public/img/icons` @ 780846e: `use` 63 (rust-icon 46% of pixels, c-sharp-icon, figma-icon, menu/reference*, menu/storage…), `mask` 18 (menu/dart, menu/swift, menu/reference-csharp…)
- supabase/supabase `apps/studio/public/img/icons` @ 780846e: `use` 10 (rust-icon, s3-icon, airtable-icon, figma-icon…), `img` 7 (frameworks/storybook, frameworks/svelte…)
- calcom/cal.com `apps/web/public/country-flag-icons` @ 54343aa: `use` 94 of 255 flags (3x2/bd, 3x2/ch, 3x2/ec…)
- refinedev/refine `packages/live-previews/public/assets/icons` @ 2352eb5: all 274 cells pass

Example: `rust-icon.svg` has `viewBox="19 19 106 106"`. The symbol keeps it, and the consumer `<svg>` also gets `viewBox="19 19 106 106"`. The `<use>` places the symbol's viewport at user-space 0,0, which is 19 units off the consumer's viewBox origin, so the icon is shifted up-left and clipped. Likely fix directions: drop `viewBox` from the consumer `<svg>` (output-contract.md line 257 already says it is optional, since the symbol's is enough), or give `<use>` the viewBox's `x y width height`. Either way it changes the adapter markup, so check it against the output contract and the Astro template parity rule.

The `img`/`mask` failures may be partly a harness artifact: those sources have `width`/`height` but no `viewBox` (storybook.svg is 39x48, swift.svg is 17x16), and the reference `<img width=48 height=48>` of an SVG without a viewBox does not scale. Verify each one before treating it as a product bug.

## Steps to Reproduce

1. `pnpm build`
2. Sparse-clone a folder, e.g. `git clone --depth 1 --filter=blob:none --sparse https://github.com/supabase/supabase && git -C supabase sparse-checkout set apps/docs/public/img/icons`
3. `node scripts/render-check.mjs --fixtures supabase/apps/docs/public/img/icons --out /tmp/render-supabase-docs` (the `--fixtures`/`--out` flags were added on 2026-10-16 for this; files the compiler rejects are dropped and listed)
4. Read the FAIL lines, or open `<out>/matrix.json`.

## Expected vs Actual

Expected: each icon rendered through the sprite matches the original file as `<img>` in the same engine (shape within 1%, mono icons recolored).
Actual: 432 failing cells on Supabase docs, 81 on Supabase studio and 560 on cal.com flags across 3 engines. rust-icon differs in 46% of pixels, and the BD/CH flags sit at the top of the box instead of the middle.

## Error messages/logs

```
FAIL use        rust-icon: shape differs in 46.42% of pixels
FAIL use        menu/reference-functions: shape differs in 11.28% of pixels
FAIL mask       menu/swift: shape differs in 9.38% of pixels
FAIL img        frameworks/storybook: shape differs in 18.46% of pixels
render:check failed: 432 cell(s)
```

Fixture gap: add a fixture with a non-zero viewBox origin and a non-square one (3:2) so `pnpm render:check` covers both.
