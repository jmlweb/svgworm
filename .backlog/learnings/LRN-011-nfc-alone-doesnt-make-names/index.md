---
id: LRN-011
title: NFC alone doesn't make names case- and order-stable
status: active
tags: [unicode, determinism, naming]
task: TSK-006
created: 2026-10-07
---

## Context
Adversarial review of ADR-0007.
## Insight
`toLowerCase` applies context-dependent Final_Sigma, so `ΟΔΟΣ.x` and `ΟΔΟΣ_x` lowercase differently. Variation selectors and combining marks pass a `\p{L}\p{M}\p{N}` filter and can yield invisible names. Node silently turns undecodable file names into U+FFFD. Raw source paths stay NFD even when the derived name is NFC.
## Application
Fold `ς` to `σ`. Treat default-ignorables and unattached marks as separators. Read directory entries as bytes and validate UTF-8. NFC-normalize every path written to output. Test exhaustively over all code points.
