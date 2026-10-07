---
id: LRN-013
title: TypeScript 7 blocks type-aware linting
status: active
tags: [tooling, typescript, adr]
task: TSK-009
created: 2026-10-07
---

## Context
TS 7.0.2 (native) is npm `latest`, but typescript-eslint 8.71 declares peer `typescript <6.1.0` because TS 7.0 has no programmatic API.
## Insight
"Latest TS" and "type-aware lint" can't both hold until TS 7.1 or a typescript-eslint update.
## Application
Keep the repo on TS 6.0; type-test generated types against both TS 6 and 7 in CI. Recheck at TS 7.1.
