---
id: TSK-042
title: Fix: Generated Icon.astro drops an object style on mask icons
status: complete
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-002
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Fix: Generated Icon.astro drops an object style on mask icons

## Description

### Summary
In the `mask` branch, the Astro template in `svgworm init` keeps `style` only when it is a string (`const userStyle = typeof style === 'string' ? style : '';`). An object `style` is silently dropped. `createIcon` from @svgworm/react spreads it into the mask style.

### Key details
- Template: `packages/svgworm/src/cli/init/plan.ts` (the `astroComponentContent` mask branch); generated copy at `apps/site/src/components/Icon.astro:79`.
- Astro's types accept object styles (`astro-jsx.d.ts`: `style?: string | CSSProperties | ...`), and the template's `Props` extends `HTMLAttributes<'svg'>`, so the object form type-checks and then vanishes.
- Only `mask` is affected; `img` and `use` pass `style` through.
- ADR-0017 relies on `apps/site/tests/icon-conformance.test.ts` to catch drift, but it only passes string styles to Astro (lines 122, 138).
- Fix: serialize an object style to CSS (kebab-case keys, bare numbers as px where React adds them), or reject it loudly.

Source: RPT-002.

## Acceptance Criteria

- [x] An object style on a mask-delivered icon reaches the span in the generated Icon.astro, as with createIcon — evidence: icon-conformance.test.ts case mask, object style: Astro output equals createIcon output → pass (2026-10-15)
- [x] apps/site/tests/icon-conformance.test.ts covers a mask icon with an object style (test written first) — evidence: case added before the template fix and seen failing (object style dropped), then passing (2026-10-15)
- [x] apps/site/src/components/Icon.astro is regenerated from the fixed template — evidence: pnpm --filter svgworm build, svgworm init --framework astro --yes in a scratch project, generated file diffed against apps/site/src/components/Icon.astro: only the userStyle hunk differs; copied in (2026-10-15)
- [x] A changeset records the generated-output change — evidence: .changeset/astro-mask-object-style.md (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Template in cli/init/plan.ts serializes object styles (kebab-case, px for non-unitless numbers, custom properties kept). Site Icon.astro regenerated. conformance 13 passed; typecheck, lint, format:check exit 0.
- [2026-10-15] Completed