# 0030. The consumer `<svg>` of a `use` icon gets only the viewBox size

- **Status:** accepted
- **Date:** 2026-10-16
- **Task:** RPT-006
- **Supersedes:** [ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md) point 5 (Q-03) only: "Adapters may still put the same `viewBox` on the consumer `<svg>`. It's harmless"

## Context

A `use` icon renders as `<svg viewBox><use href="…#id"/></svg>`. `@svgworm/react` and the generated `Icon.astro` put the icon's own viewBox (`icons.<name>.viewBox`) on that `<svg>`. ADR-0006 called this harmless. The TSK-002 spike only had icons whose viewBox starts at `0 0`, and so did the fixture set.

A `<use>` that references a `<symbol>` draws the symbol in a new viewport at `x=0 y=0` of the consumer's user space, sized `100%` of the consumer's viewBox. The symbol's own viewBox maps the icon into that viewport. When the icon's viewBox starts somewhere else (`19 19 106 106`), the consumer shows the region from `19,19`, but the symbol is drawn from `0,0`. The icon is shifted by its origin and clipped.

Real exports have such origins. Logos cropped in a design tool get them, and so do flags cropped from 4:3 to 3:2. A browser check of four public icon folders on 2026-10-16 (`node scripts/render-check.mjs --fixtures <folder>`) found:

- 63 shifted `use` icons in supabase/supabase `apps/docs/public/img/icons` and 10 in `apps/studio/public/img/icons` (commit 780846e)
- 94 of 255 flags in calcom/cal.com `apps/web/public/country-flag-icons` (commit 54343aa)

The same icons failed in Chromium, Firefox and WebKit. Every failing `use` icon had a non-zero origin, and every icon with a `0 0` origin passed, square or not.

## Options considered

1. **Consumer viewBox `0 0 {width} {height}`, taken from the icon's viewBox.** The consumer viewport then matches the symbol viewport exactly. The intrinsic aspect ratio stays, so CSS that sets only `width` still sizes a non-square icon right. It is a markup change in the adapters only. The manifest keeps the icon's real viewBox.
2. **No viewBox on the consumer.** ADR-0006 showed the symbol's viewBox is enough to scale. But the consumer loses its intrinsic aspect ratio, so a non-square icon sized by CSS width alone gets a square box.
3. **Normalize the origin in the core** by translating the content so every viewBox starts at `0 0`. It would also fix hand-written consumers, but it rewrites geometry in the pipeline (a wrapping transform, ids, hashed bytes) to fix a markup bug, and it changes `icons.<name>.viewBox` for every affected icon.

## Decision

Option 1. Adapters render the `use` form as `<svg viewBox="0 0 {width} {height}">`, where `width` and `height` are the third and fourth numbers of `icons.<name>.viewBox` (space- or comma-separated). The `<symbol>` keeps the full viewBox and owns the origin. The `img` and `mask` forms are unchanged: the stack file's nested `<svg>` is its own viewport and was never affected.

The manifest does not change. Splitting a string from the manifest is consuming the contract, not re-processing SVG, so the adapter rule in `.claude/rules/architecture.md` holds.

## Evidence

- Fixtures `fixtures/viewbox-offset/mono-offset.svg` (`19 19 106 106`) and `flag-offset.svg` (`0 85.333 512 341.333`): with the old markup, `pnpm render:check` failed both in all three engines (29 to 33% of pixels). With the new markup they pass, and `tests/render/matrix.json` records them.
- The four public folders above, re-run with the new markup: all 466 Supabase docs cells, all 217 Supabase studio cells and all 274 Refine cells pass in all three engines. cal.com is down to 6 flags out of 255 (1 to 8% of pixels). Those 6 flags draw outside their own viewBox (BV draws `height="800"` in a 733-unit viewBox). In the square test cell, the reference `<img>` shows that overflow in the letterbox band, while the symbol clips to its viewBox. In a 3:2 box (96×64, Chromium) the six render the same as the originals, checked visually.
- The same run showed the reference for sources with only `width`/`height` was stretched by `<img width height>`. The harness now gives that reference the derived `viewBox="0 0 W H"` (ADR-0006 rule 6), so both sides scale the same way.

## Consequences

- `@svgworm/react` and the `Icon.astro` template change one attribute. Existing Astro projects keep the old `Icon.astro` until they regenerate it: delete it and run `svgworm init --yes`, because init never overwrites a component that differs.
- Hand-written consumers following `docs/output-contract.md` must use the size-only viewBox or none. The contract says so.
- The fixture set now covers non-zero origins, so the render matrix guards this in CI.
