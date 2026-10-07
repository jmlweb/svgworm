# 0001. External sprite file as default delivery

- **Status:** accepted (2026-10-08, by [ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md), which adds a per-icon SVG-stack delivery for icons with `url(#…)` references)
- **Date:** 2026-10-07
- **Task:** TSK-002
- **Resolves:** Q-01

## Context

There are two ways to deliver a sprite: an external file referenced by `<use href="sprite.svg#id">`, or an inline `<svg>` with all symbols embedded in each HTML response. The prototype only got the inline path working end to end.

## Options considered

1. **External file (hashed)**: zero JS, cached across pages and deploys, HTML stays small. Cons: cross-origin restriction, possible quirks with paint servers, and the app needs the URL.
2. **Inline sprite**: no extra request and no URL handling. Cons: weighs down every SSR response, can't be cached on its own, and grows with the icon set.

## Decision

External hashed sprite file by default. Inline is opt-in for small sets or special cases.

## Evidence

Product principle (zero-JS, cacheable). Browser compatibility evidence is still pending from the Q-01 spike. If the spike shows unsolvable rendering issues, a follow-up ADR will define a per-icon inline fallback.

## Consequences

- We need a manifest so adapters know each sprite URL (see the output contract).
- We need to document the same-origin constraint (Q-02).
- Integration recipes for each framework (Q-21).
