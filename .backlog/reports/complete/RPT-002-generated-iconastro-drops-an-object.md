---
id: RPT-002
title: Generated Icon.astro drops an object style on mask icons
type: bug
severity: low
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-042
---

## Summary
In the `mask` branch, the Astro template keeps `style` only when it is a string. An object `style` is silently dropped. `createIcon` from @svgworm/react merges it.

## Details
`packages/svgworm/src/cli/init/plan.ts:481` (and the generated `apps/site/src/components/Icon.astro:79`): `const userStyle = typeof style === 'string' ? style : '';`. Astro accepts object styles (`style={{ opacity: 0.5 }}`). The `img` and `use` branches pass `style` through untouched, so only `mask` loses it. React spreads `...style` into `maskStyle` (`packages/react/src/create-icon.tsx:124`).

ADR-0017 accepts the duplicated delivery logic and relies on `apps/site/tests/icon-conformance.test.ts` as the guard. That test only passes string styles to Astro (lines 122, 138), so it can't catch this.

## Steps to Reproduce
1. `svgworm init --framework astro` in an Astro project.
2. Render a mask-delivered icon (mono with a `url(#…)` reference) with `<Icon name="…" style={{ opacity: 0.5 }} />`.

## Expected vs Actual
- Expected: the span carries the mask style plus `opacity:0.5`, as with `createIcon`.
- Actual: the span carries the mask style only, and the user's style disappears without a warning.

## Error messages/logs
None. It fails silently.

## Fix
Serialize an object style to a CSS string (kebab-case keys, bare numbers as px where React would add them), or reject it loudly. Add an object-style mask case to the conformance test.
