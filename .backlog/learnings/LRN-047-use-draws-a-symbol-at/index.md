---
id: LRN-047
title: <use> draws a symbol at 0,0: the consumer viewBox must not carry the icon's origin
status: active
tags: [svg, use, viewbox, render, fixtures]
task: TSK-094
created: 2026-10-15
---

## Context

Real icon folders (Supabase, cal.com) rendered shifted through the sprite in all three engines, while the whole fixture set passed `pnpm render:check`.

## Insight

`<use href="#symbol">` places the symbol's viewport at `x=0 y=0` of the consumer's user space. Copying the icon's viewBox (`19 19 106 106`) onto the consumer `<svg>` makes it show the region from `19,19`, so the icon shifts by its origin. Only the size belongs on the consumer; the symbol keeps the origin. Every fixture had a `0 0` origin, so the bug was invisible. Design-tool crops and 4:3-to-3:2 flags commonly have offset origins.

A second trap was in the harness: `<img width height>` of an SVG without a viewBox stretches it, so the reference must get the derived viewBox before it is compared.

## Application

Cover geometry edge cases in fixtures, not just paint features: offset origins, non-square shapes, missing viewBox. Run `node scripts/render-check.mjs --fixtures <folder> --out <dir>` on a real-world folder before claiming "renders the same" in public.
