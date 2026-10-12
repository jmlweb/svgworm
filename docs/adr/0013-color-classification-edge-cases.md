# 0013. Color classification edge cases: markers, CSS variables, SMIL animations

- **Status:** accepted
- **Date:** 2026-10-12
- **Task:** TSK-027
- **Resolves:** the "not covered" items of [ADR-0004](0004-per-icon-color-classification.md) (markers, CSS variables, color animations). Text stays out of scope.

## Context

ADR-0004 classifies each icon as mono or multicolor from what renders, and rewrites mono icons to `currentColor` per element. Its spike corpus had no markers, no `var(--…)` paints and no SMIL, so the ADR said to "treat them as multicolor" until they were covered. Until now the code did something else for two of the three:

- **Markers.** `marker` was in the non-rendered set and `marker-*` references were never followed, so a marker's colors were not counted. A mono line with a red arrowhead was called mono and its line recolored, leaving the red head: a dangerous error in the ADR-0004 sense.
- **CSS variables.** `fill="var(--x)"` was normalized to the lowercased string and counted as one literal color. A single-color icon that uses a variable was mono, and the rewrite replaced the variable with `currentColor`, destroying the author's theming hook.
- **SMIL.** `<animate attributeName="fill">` was ignored, so an icon whose fill animates between colors was mono, and the rewrite froze it on `currentColor`.

## Options considered

1. **Keep "treat as multicolor" as a documented caveat.** Costs nothing, but the code did not do it, and the marker case recolors icons wrongly today.
2. **Make the classifier see all three and keep the two-class model.** Chosen. Markers are followed and counted like `<use>` targets; a `var(` paint or an animated paint property raises a flag that forces multicolor, the same mechanism patterns and raster already use.
3. **A third class, "themed", for variable icons.** The manifest field is frozen for v0.1 (`mono | multicolor`), and a consumer gains nothing: a themed icon is rendered exactly like a multicolor one (as drawn).

## Decision

- **Markers** (`marker-start`, `marker-mid`, `marker-end`, `marker` on a shape) are rendered content. The classifier follows the reference and counts the marker's paints. The marker inherits from its own ancestors, not from the referencing shape (SVG 2, "Marker properties"), so the walk starts from the root state: a marker that relies on the default fill paints black. The mono rewrite recolors marker content like any other site. Since a marker is a `url(#…)` reference, the icon is delivered from the stack (ADR-0006), as before.
- **CSS variables.** A `var(` in `fill`, `stroke`, `stop-color`, `flood-color`, `lighting-color` or `color` sets the `variable` flag: the icon is multicolor and never rewritten, whatever else it paints. The author already chose how it is themed, and `preserve` is the only safe output. A forced `mono` override on such an icon is an error (`color/forced-mono-unsafe`), like for raster content.
- **SMIL.** `<animate>` or `<set>` with an `attributeName` that is a paint property or `color`, and any `<animateColor>`, set the `animation` flag: multicolor, never rewritten. Animating `transform`, `opacity` or geometry does not affect classification. CSS animations cannot reach the sprite: an `@keyframes` block is an unscopable `<style>` and already an error (ADR-0004).
- Flags are reported in the forced-mono error with plain words ("a CSS variable paint", "a color animation").

## Evidence

- Unit tests in `classify.test.ts` and `rewrite.test.ts` (ADR-0013 blocks) and the five new fixtures (`fixtures/markers`, `fixtures/css-variables`, `fixtures/animation`), whose output is in the reviewed snapshots: `markers/arrow-mono` mono + mask, `markers/arrow-two-tone` multicolor + img, `css-variables/themed-fill` multicolor + use, `animation/pulse-fill` multicolor + use, `animation/spin` mono + use.
- Render check with resvg 2.6.2 (the TSK-003 oracle), 2026-10-12: the rewritten `markers/arrow-mono` covers the same pixels as the source (same alpha coverage) and, rendered with `color: #ff0000`, 100% of its opaque pixels are red, marker head included. `animation/spin` likewise. Script in the TSK-027 progress log.
- The TSK-003 corpus had no marker, variable or SMIL icon among 31,390, so this is a correctness closure, not a frequency problem.

## Consequences

- An icon that was mono before and used a marker in another color is now multicolor (correct). A single-color icon with a `var(` paint is now multicolor and keeps its variable (before, the variable was lost). These change output bytes for such icons, hence a changeset. No contract field changes.
- `ColorKind` stays two-valued. If a "themed" distinction is ever needed for adapters, it needs a contract ADR.
- Browser parity of the marker rewrite in an external stack file is covered by the delivery rule (ADR-0006), not re-verified here. Text remains uncovered: resvg runs without fonts in the oracle.
