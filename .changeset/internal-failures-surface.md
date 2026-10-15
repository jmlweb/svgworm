---
'svgworm': patch
---

A failure inside svgworm's own per-icon pipeline is no longer reported as `svg/invalid-xml` against the icon being processed. It now surfaces as `unexpected failure: …` with exit code 1, so a svgworm bug does not look like a broken SVG. An svgo error on the input itself (for example CSS it cannot parse) still comes back as an `svg/invalid-xml` diagnostic on that file, now prefixed with `svgo could not process the file:`.
