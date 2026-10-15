---
id: LRN-045
title: A new vite version in any workspace package splits vitest's vite peer and untypes vitest configs
status: active
tags: [tooling, vite, vitest, pnpm, lint]
task: TSK-024
created: 2026-10-15
---

## Context
TSK-024 added examples/vite-react with vite 8.3.2 while the workspace already resolved vite 8.3.3 (astro, vitest).
## Insight
pnpm then resolved a second vitest instance against another vite peer, and type-aware oxlint reported `no-unsafe-assignment` on `test:` in both packages' vitest.config.ts (the config became `any`). Same failure mode as the @types/node override comment in pnpm-workspace.yaml.
## Application
Pin a new workspace package's vite and @vitejs/* to the versions already in pnpm-lock.yaml (`grep "^  vite@" pnpm-lock.yaml`), then run `pnpm lint` before committing.
