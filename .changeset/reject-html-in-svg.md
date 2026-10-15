---
'svgworm': patch
---

Build-time validation now also rejects HTML elements an SVG can carry in another namespace (`base`, `meta`, `link`, `img`, `form`, `input`, `frame` and similar: `svg/forbidden-element`), a `srcdoc` attribute, and `src`, `data`, `action`, `formaction` or `poster` attributes that point outside the file (`svg/external-reference`). No icon set we test uses them; they could load documents or rewrite page URLs once a sprite is injected (security review of ADR-0027).
