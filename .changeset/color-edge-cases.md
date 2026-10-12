---
'svgworm': minor
---

Color classification now sees markers, CSS variable paints and SMIL color animations (ADR-0013). Marker content counts toward an icon's colors and is recolored with the icon when it is mono, so a mono line with a differently colored arrowhead is multicolor instead of being half recolored. A `var(--…)` paint or an `<animate>`/`<set>` on a paint property makes the icon multicolor and it is never rewritten, keeping the author's theming or animation intact. Forcing `mono` on such an icon is an error that names the reason.
