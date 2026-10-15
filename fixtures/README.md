# Fixtures

Small, committed SVG set that covers every case in [`.claude/rules/testing.md`](../.claude/rules/testing.md). Sources and licenses are in [LICENSES.md](LICENSES.md).

The large accuracy corpus (31k icons) is not committed. It is rebuilt from pinned npm packages by `spikes/TSK-003-color-classification/src/build-corpus.mjs`.

"Expected" is the behavior the product should have, per the ADRs. Where an open question decides it, the question is linked.

| Folder | What it tests | Expected |
|--------|---------------|----------|
| `mono-fill/` | One fill color. Covers explicit `currentColor` (heroicons), implicit default black (simple-icons), opacity variants of one color (phosphor duotone), and a Figma-style export with hardcoded `#1E1E1E` and a white clip rect | mono; follows `currentColor` ([ADR-0004](../docs/adr/0004-per-icon-color-classification.md)) |
| `stroke/` | Stroke-only icons with `fill="none"`, including a Figma-style export | mono; stroke follows `currentColor`, fill stays `none` |
| `mixed-fill-stroke/` | `badge.svg`: one color used as both fill and stroke. `two-tone.svg`: fill and stroke in different colors | `badge` mono, `two-tone` multicolor |
| `multicolor/` | Several flat colors (flat-color-icons, a flag) | multicolor; colors preserved |
| `gradient/` | Linear gradients. `logos-scaledrone-transparent-stop.svg` fades to transparent white, which still tints the gradient | multicolor; ids prefixed per icon |
| `mask/` | `knockout.svg`: white/black mask on a mono shape. `logos-nextjs.svg`: real-world mask | `knockout` mono with the mask untouched; ids prefixed |
| `clip-path/` | `clipPath` geometry | clip content is never recolored; ids prefixed |
| `filter/` | SVG filter on a logo | colors from filters count; external rendering checked in TSK-002 ([Q-01](../docs/open-questions.md)) |
| `nested-svg/` | `<svg>` inside the root `<svg>` | handled by an AST transform, not string replacement (prototype lesson) |
| `style/` | Illustrator-style `<style>` class rules (mono and multicolor). `unscopable-media.svg` has an `@media` rule that can't be inlined | inlined to attributes; `unscopable-media` is an error ([Q-04](../docs/open-questions.md)) |
| `internal-refs/` | `<use href="#id">` and other internal references | references followed; ids prefixed per icon |
| `duplicates/` | `close.svg` in two folders | `actions/close` and `arrows/close`; with `flatten`, one collision error listing both ([ADR-0007](../docs/adr/0007-icon-naming-and-collision-policy.md)) |
| `non-ascii/` | `café.svg` (NFC) and `日本.svg`. Tests generate the NFD variant of `café` at runtime, so git or the OS can't normalize it away | same name and id for NFC and NFD: `café` / `i-caf_e9_`, `日本` / `i-_65e5__672c_` ([ADR-0007](../docs/adr/0007-icon-naming-and-collision-policy.md)) |
| `invalid/` | Empty file, unclosed root, non-SVG root, `<script>`, external `href`, and a root `width`/`height` in `%` with no `viewBox` | clear error per file ([ADR-0006](../docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md): a missing `viewBox` is an error unless width and height are plain numbers or `px`) |
| `markers/` | `arrow-mono.svg`: a line and an arrowhead marker in one color. `arrow-two-tone.svg`: the marker in another color | marker content counts; `arrow-mono` is mono and delivered from the stack (`url(#)`), `arrow-two-tone` multicolor ([ADR-0013](../docs/adr/0013-color-classification-edge-cases.md)) |
| `css-variables/` | `themed-fill.svg`: `fill="var(--icon-color, #1e1e1e)"` | multicolor and never rewritten: the variable is the author's theming hook ([ADR-0013](../docs/adr/0013-color-classification-edge-cases.md)) |
| `animation/` | `pulse-fill.svg`: SMIL `<animate attributeName="fill">`. `spin.svg`: `<animateTransform>` only | `pulse-fill` multicolor (animated paint), `spin` mono ([ADR-0013](../docs/adr/0013-color-classification-edge-cases.md)) |
| `viewbox-derived/` | `no-viewbox.svg`: no `viewBox`, `width="24" height="24"` | valid; `viewBox="0 0 24 24"` is derived and reported as a warning ([ADR-0006](../docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md), rule 6) |
| `viewbox-offset/` | `viewBox` whose origin is not `0 0`: a mono icon (`19 19 106 106`) and a 3:2 flag (`0 85.333 512 341.333`), as in real logo and flag exports | valid; renders in place through `<use>`, because adapters give the consumer `<svg>` only the size (`0 0 W H`) and leave the origin to the symbol (RPT-006) |
