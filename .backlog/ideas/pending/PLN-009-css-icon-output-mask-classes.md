---
id: PLN-009
title: CSS icon output: mask classes for Tailwind, UnoCSS and background use
status: pending
created: 2026-10-15
complexity: high
---

## Goal

Emit an optional CSS file with one class per mono icon (`.svgworm-home { mask: url(/icons/icons.stack.<hash>.svg#i-home) … ; background-color: currentColor }`). Icons then work from CSS alone, for example `class="svgworm-home"`, `::before` or a Tailwind/UnoCSS utility, with no component and no JS.

## Context

- Competitor pull: UnoCSS/Iconify presets (`i-lucide-home`) and vite-plugin-svg-spritemap (CSS output and `<view>` fragments) let utility-CSS teams use icons without components. svgworm has no CSS path.
- svgworm already has a `mask` delivery (ADR-0006): mono icons with references go into the stack file `<group>.stack.<hash>.svg`. That file nests one `<svg id>` per icon and shows only the `:target` (`packages/svgworm/src/core/assemble/sprite.ts`). The stack holds **only** icons that need it. Icons without references live in the `<symbol>` sprite, which a CSS `url()` cannot address.
- **No demand is recorded as of 2026-10-16.** Do not start before users ask for it (issues, outreach answers).

## Approach

1. Run a spike: put every mono icon in a stack-form file, then render it in Chromium, Firefox and WebKit through `mask-image: url(file.svg#id)`, using `pnpm render:check` methods. Measure the size against the `<symbol>` sprite, which may mean a duplicate file.
2. Write an ADR: the CSS output form, the class naming (`svgworm-<id>`, escaped for `/` namespaces), whether multicolor icons get `background-image`, opt-in config (`css: true` or `css: { file, prefix }`), and how a hashed CSS file reaches the app.
3. Emit: a hashed `icons.<hash>.css` plus a manifest entry. Same determinism rules: sorted, content hash.
4. Tailwind/UnoCSS: document how to `@import` the file or map the classes. A preset package stays out of scope, unless the ADR finds a zero-dependency way.
5. Docs and contract: `docs/output-contract.md`, the config docs, `llms.txt`, and the render matrix extended with the CSS form.

## Files to Modify

- `spikes/TSK-xxx-css-mask-output/`: new, evidence only
- `docs/adr/NNNN-css-icon-output.md`: new
- `packages/svgworm/src/core/config/schema.ts`: opt-in `css` option
- `packages/svgworm/src/core/assemble/sprite.ts`: a stack-form file for CSS-addressable icons
- `packages/svgworm/src/core/emit/`: new CSS emitter, manifest entry
- `packages/svgworm/src/core/write.ts`: `OWNED_FILE` covers the CSS file
- `scripts/render-check.mjs`, `tests/render/matrix.json`: CSS delivery form
- `docs/output-contract.md`, `apps/site/src/content/docs/config.md`, `llms.txt`

## Risks & Considerations

- Output contract change: needs an ADR and a semver note.
- No type safety: a misspelled CSS class is no error, which goes against principle 4. Mitigate by documenting a component or `IconName` for typed use, or by generating Tailwind safelist types.
- Mask icons can't keep their own colors, so multicolor icons need `background-image`. That loses `currentColor` and adds one more form to test.
- Every engine fetches a mask `url()` in CORS mode. Cross-origin sprites need CORS headers, unlike `<use>`. Check against ADR-0027.
- File size: a second copy of the mono icons in stack form.

## Open Questions

- Should CSS output replace or duplicate the `<symbol>` sprite for mono icons?
- Should the class prefix be configurable? What is the default?
- Should multicolor icons be in CSS output at all?

## Revision History
- [2026-10-31] Backlog grooming: demand re-checked and still none (no GitHub issue on jmlweb/svgworm, nothing in `docs/metrics/manual.json`). Paths in Files to Modify verified on main 580c3ef. Left pending until users ask for CSS output.
