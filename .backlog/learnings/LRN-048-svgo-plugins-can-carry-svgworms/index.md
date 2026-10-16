---
id: LRN-048
title: svgo plugins can carry svgworm's own steps through one optimize() run
status: active
tags: [svgo, perf, core, errors]
task: TSK-096
created: 2026-10-16
---

## Context
transformIcon ran five svgo optimize() calls per icon, each a full parse plus stringify, only to get trees to inspect (svgo has no public parse, LRN-015).

## Insight
svgo 4.1's invokePlugins calls custom plugin `fn`s in order and catches nothing, so svgworm's checks can run as custom plugins between the builtin ones, and a thrown Error subclass leaves optimize() unwrapped. A stage variable set by each custom plugin tells a parse error (thrown before any plugin), a builtin plugin failure, and a svgworm bug apart. Closure-assigned `let` needs a widening cast (`Stage.PARSE as Stage`), or TypeScript narrows it to the initial literal. oxlint's only-throw-error forbids non-Error sentinels.

## Application
Add new per-icon steps as plugins in the single run in transform.ts, not as extra optimize() calls. The pin test in transform.test.ts fails if an svgo bump starts wrapping plugin throws. The scratch parity harness approach (full transformIcon JSON over big icon packs, before vs after) proved 0 diffs on 37k cases.
