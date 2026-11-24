---
id: LRN-071
title: Dangling internal id references are checked on the raw tree, before svgo
status: active
tags: [core, svg, validation, ids]
task: TSK-111
created: 2026-11-24
---

`svg/missing-reference` runs in `validateTree` (svgworm-intake plugin), on the source tree before svgo and `renameIds`. Checking later would be wrong: `renameIds` keeps an undefined id verbatim (`mapping.get(id) ?? id`), and svgo may already have rewritten or dropped elements. Ids are collected in a first pass over the whole document (root included), so forward references (`<use href="#a">` before `<defs><path id="a">`) are valid. SMIL `begin`/`end` targets use the same "letter after the dot" rule as `renameIds`, so clock values like `0.5s` never count as ids. Unit tests that feed `validateTree` hand-written markup must now define every id they reference (tree.test.ts had `href="#a"` and `url(#g)` with no target).
