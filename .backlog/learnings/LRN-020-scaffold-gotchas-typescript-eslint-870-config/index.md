---
id: LRN-020
title: Scaffold gotchas: typescript-eslint 8.70 config API, TS 7 via pnpm dlx, Prettier rewrites docs
status: active
tags: [tooling, eslint, typescript, pnpm]
task: TSK-010
created: 2026-10-11
---


## Context
Scaffolding the pnpm workspace (TSK-010) with ESLint 10, typescript-eslint 8.70.1, Vitest 5, TS 6.0.3.
## Insight
- `tseslint.config()` is deprecated (typed lint flags it); use `defineConfig` from `eslint/config`.
- Typed linting of `.mjs` and package `vitest.config.ts` fails with projectService unless `allowDefaultProject` lists them (`packages/*/vitest.config.ts`, single `*` only) or `.mjs` gets `tseslint.configs.disableTypeChecked`.
- TS 7 can type-check the repo today: `pnpm --package=typescript@7.0.2 dlx tsc -p tsconfig.json --noEmit` (the `dlx -p` form mis-parses and errors TS5042).
- `pnpm format` rewrites hand-written docs (tables, emphasis markers); keep `*.md` in `.prettierignore`.
- Vitest: a package with no tests needs `passWithNoTests` (also under `typecheck`).
## Application
Reuse the root eslint/prettier/vitest configs; remove `passWithNoTests` from packages/react once TSK-012 adds tests.