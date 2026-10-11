---
id: LRN-013
title: TypeScript 7 blocked typescript-eslint, not type-aware linting (superseded by ADR-0011)
status: active
tags: [tooling, typescript, adr]
task: TSK-009
created: 2026-10-07
---

## Context
TS 7.0.2 (native) is npm `latest`, but typescript-eslint 8.71 declares peer `typescript <6.1.0` because TS 7.0 has no programmatic API.
## Insight
That blocker applied to ESLint only. ADR-0011 moved lint to Oxlint, whose type-aware rules run on oxlint-tsgolint (typescript-go), so type-aware lint no longer depends on the TypeScript JS API. The repo still builds on TS 6.0 by choice, not by necessity.
## Application
Keep the repo on TS 6.0 for now; type-test generated types against both TS 6 and 7 in CI (typecheck:ts7). Moving builds and type checks to TS 7 is tracked as a task, to revisit at TS 7.1.