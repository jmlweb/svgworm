---
id: LRN-058
title: TypeScript 7 has no JS compiler API, and an optional peer upper bound still breaks npm install
status: active
tags: [typescript, peer-dependencies, npm, codemod]
task: TSK-093
created: 2026-10-17
---

## Context
The `migrate svgr` codemod (TSK-093, ADR-0035) loads the user's TypeScript at run time as an optional peer.

## Insight
- `typescript@7.0.2` exports only `version` from its main entry (`lib/version.cjs`), plus `./unstable/*` IPC APIs. It has no `createSourceFile` and no `createProgram`, so a JS compiler-API tool needs TypeScript 5 or 6.
- An optional peer (`peerDependenciesMeta.optional`) is still range-checked when the package is installed. With `"typescript": ">=5.0.0 <7"`, `npm install svgworm` in a project on `typescript@7.0.2` failed with `ERESOLVE`, and pnpm warns.

## Application
- Keep optional peer ranges open-ended (`>=5.0.0`). Enforce the real limit at run time, by duck-typing the loaded module (`typeof api.createSourceFile === 'function'`), and exit with a hint (`npx -p typescript@6 -p svgworm …`).
- Verify any peer range change with `pnpm pack` and `npm install` of the packed tarball into a scratch project.
