---
id: LRN-029
title: svgworm check must run before the build in CI, or it proves nothing
status: active
tags: [ci, check, example]
task: TSK-016
created: 2026-10-12
---

## Context
The example's `prebuild` runs `svgworm`, which regenerates the output. Running `svgworm check` after `next build` always passes because the files were just rewritten.
## Insight
`check` compares the committed output with a fresh compile. It only catches a forgotten rebuild when it runs against the files as committed, before any step that regenerates them.
## Application
Order CI as `svgworm check`, then build, then post-build checks (see `pnpm example:check`). Document the same order to users: `check` in CI, `svgworm` in prebuild locally.
