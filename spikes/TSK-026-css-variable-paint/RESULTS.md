# TSK-026 spike: CSS-variable paints through an external sprite

Question (Q-12): should svgworm add a mode that rewrites multicolor icons to custom properties (`--icon-color-1`, …) for theming? First check whether author-written `var()` paints already theme through svgworm's default delivery.

## Method

`src/check.mjs` compiles one two-color icon with the built core (`fill="var(--icon-color-1, #00ff00)"` on the left half, `var(--icon-color-2, #0000ff)` on the right). It is classified multicolor and delivered as `use`, so it is a symbol in the external sprite. A page served over HTTP from one origin renders it through `<use href="/icons/icons.<hash>.svg#id">` three ways: variables set on the `<svg>`, one variable inherited from an ancestor `<div>`, and none. Each engine screenshots the icon and samples the center of each half.

Run: `pnpm install --ignore-workspace && pnpm check` (after `pnpm build` at the root). Playwright 1.58.2.

## Result (2026-10-15)

All 9 cases pass: custom properties inherit into the `<use>` shadow tree of an external sprite in Chromium, Firefox and WebKit, and the fallback applies when a variable is unset. Matrix: [results/matrix.md](results/matrix.md).

Limits: an icon that also needs `url(#…)` (gradient, mask) goes to the stack and renders as `<img>`, a separate document that page CSS cannot reach, so variables there only ever show their fallback. Real Safari not checked (Playwright WebKit is not Safari).

Decision: [ADR-0026](../../docs/adr/0026-no-generated-css-variable-color-mode.md).
