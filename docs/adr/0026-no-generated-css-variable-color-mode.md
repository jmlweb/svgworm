# 0026. No generated CSS-variable color mode; author-written variables are the theming hook

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-026
- **Resolves:** Q-12

## Context

Q-12 asks for a mode that themes multicolor icons through custom properties: svgworm would rewrite each distinct color of a multicolor icon to `var(--icon-color-N, <original>)`, so CSS could recolor it. [ADR-0004](0004-per-icon-color-classification.md) deferred it past v1; [ADR-0013](0013-color-classification-edge-cases.md) then made `var()` paints written by the author a first-class case: such an icon is multicolor and its paints are never rewritten.

## Options considered

1. **Generated slots** (`--icon-color-1`, `--icon-color-2`, … per icon, numbered by first appearance or by sorted color).
   - Cons: the slot numbers mean nothing outside one icon. `--icon-color-1` is blue in one icon and the background in the next, so a page cannot theme a set with one rule. The numbering also moves when the artwork changes (a color added before another renumbers every later slot), so an icon update silently re-themes it wrong. Making it stable needs a per-icon mapping the user maintains, which is what writing the variables in the SVG already is. It would also be a second color mode to classify, document, snapshot and keep deterministic.
2. **Named slots from a config map** (`"#2196f3": "--brand"`).
   - Pros: meaningful names across a set.
   - Cons: a palette is a design decision that belongs in the artwork; a config map duplicates it and breaks when the designer nudges a hex value. Still a rewrite of the user's paints, which ADR-0013 rejected for good reason.
3. **No mode; document author-written variables.** The designer exports (or edits) `fill="var(--brand, #2196f3)"`, svgworm keeps it as is (ADR-0013), and the page sets `--brand` on the icon or any ancestor.

## Decision

Option 3. svgworm adds no CSS-variable color mode and never generates custom properties. Theming a multicolor icon means writing `var(--name, fallback)` paints in the SVG source. The docs show it in "How it works", next to the color classes, with its one limit: an icon that also needs `url(#…)` references is delivered from the stack as `<img>`, which page CSS cannot reach, so its variables only show their fallbacks.

## Evidence

- Browser spike [`spikes/TSK-026-css-variable-paint`](../../spikes/TSK-026-css-variable-paint/RESULTS.md): a two-variable icon compiled by the built core, delivered as `use` from an external sprite. Variables set on the `<svg>`, inherited from an ancestor, and unset (fallback) render the expected colors in Chromium, Firefox and WebKit (Playwright 1.58.2), 9 of 9 cases.
- `fixtures/css-variables/themed-fill.svg` and the reviewed snapshot in `core/__snapshots__/fixtures/`: `fill="var(--icon-color, #1e1e1e)"` survives svgo and classification unchanged, as `multicolor` with `delivery: use`.

## Consequences

- No change to the output contract, config or adapters.
- `docs/open-questions.md` Q-12 is resolved; "How it works" gets a short "Theme a multicolor icon" note.
- Theming a stack icon (`img`) stays impossible by design of `<img>`; nothing in svgworm can change that.
