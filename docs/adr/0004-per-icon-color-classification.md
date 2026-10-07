# 0004. Per-icon color: render-verified classification and per-element currentColor rewrite

- **Status:** accepted
- **Date:** 2026-10-08
- **Task:** TSK-003
- **Resolves:** Q-10, Q-11; partly Q-04; defers Q-12

## Context

Principle 6 says color handling is decided per icon. The old prototype set `fill="currentColor"` on the root, which broke stroke icons. The closest competitor, @neodx/svg, resets every color to `currentColor` by default: in the [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md) it silently flattened multicolor icons and changed a mask. We need a rule that themes single-color icons and never damages multicolor ones, with no configuration.

## Options considered

1. **Global reset to `currentColor`** (prototype, neodx default). Simple, but it flattens multicolor icons and breaks masks. Rejected by the TSK-007 evidence.
2. **Classify by source set or folder (manual config).** Accurate when configured, but it is configuration the user has to know to write, and wrong by default.
3. **Three classes: mono, stroke, multicolor**, with a different rewrite for each. The spike showed "stroke" isn't needed as a class: a per-element rewrite handles fill, stroke, and mixed icons the same way.
4. **Automatic two-class classification (mono / multicolor) by static analysis, with a per-element rewrite.** Chosen.

## Decision

- Each icon is classified as **mono** or **multicolor** by analyzing what actually renders (see the spike for the exact rules). Literal colors within 8 per channel count as one.
- **Mono** icons are rewritten so their color follows `currentColor`:
  - each effective paint value is replaced on the element that declares it, never by forcing the root;
  - the root gets `fill="currentColor"` only when the icon relies on the default black fill;
  - masks keep their own paint (made explicit first), `clipPath` content is untouched.
- **Multicolor** icons are kept byte-for-byte in color. `currentColor` already in them keeps working.
- Classification never fails the build, since the error it can make is the safe one (keeping an icon multicolor). These do fail loudly:
  - a `<style>` that can't be fully inlined;
  - a forced `mono` override on an icon with raster or pattern content.
- Overrides: an ordered list of `{ match: <glob>, color: 'auto' | 'mono' | 'preserve' }` rules in config. The last matching rule wins. `mono` forces the rewrite (deliberate flattening); `preserve` skips it.
- The manifest's `color` field becomes `mono | multicolor` (drop `stroke`).
- **Q-12 (CSS custom-property mode for multicolor)** is deferred past v1. If it comes, it should emit `var(--…, <original>)` so the fallback looks identical.

## Evidence

[TSK-003 spike](../../spikes/TSK-003-color-classification/RESULTS.md), 31,390 icons from 11 OSS packages plus synthetic Figma and Illustrator exports, with ground truth from rendering:

- 99.98% classification agreement (99.96% on hardcoded-color icons), 0 dangerous errors.
- 100% of 21,667 mono rewrites render with the same shape and fully in the new color.
- Robust to the oracle threshold: ≥ 99.15% from 6 to 40.

## Consequences

- Zero-config color handling becomes a concrete differentiator against @neodx/svg's defaults.
- The core needs inheritance-aware SVG traversal (`<use>`, gradients, filters, masks). The parser and optimizer choice (TSK-009) must support it.
- Markers, CSS variables, color animations, and text are not covered yet. Until they are, treat them as multicolor.
- The rewrite was only checked against resvg. TSK-002 must confirm it in Chromium, Firefox, and WebKit.
- The output contract draft changes (`color: mono | multicolor`). It isn't accepted yet, so no semver note is needed.
