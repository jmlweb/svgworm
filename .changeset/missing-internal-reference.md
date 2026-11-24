---
'svgworm': minor
---

Reject an icon whose internal reference points to an id the file does not define, with the new error `svg/missing-reference`. A dangling `href="#…"`, `url(#…)` (in an attribute, a `style` attribute or a `<style>` block) or SMIL `begin`/`end` reference used to build with exit code 0 and render a blank icon. The message names the file, the element and the missing id.
