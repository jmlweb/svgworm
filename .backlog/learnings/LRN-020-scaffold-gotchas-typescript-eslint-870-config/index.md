---
id: LRN-020
title: Scaffold gotchas: TS 7 via pnpm dlx, passWithNoTests, Markdown rewritten by formatters (ESLint parts obsolete)
status: active
tags: [tooling, eslint, typescript, pnpm]
task: TSK-010
created: 2026-10-11
---

## Context
Scaffolding the pnpm workspace (TSK-010) with Vitest 5 and TS 6.0.3. The ESLint 10 and typescript-eslint notes below applied to the first scaffold and went away with ADR-0011 (Oxlint).
## Insight
- TS 7 can type-check the repo today: `pnpm --package=typescript@7.0.2 dlx tsc -p tsconfig.json --noEmit` (the `dlx -p` form mis-parses and errors TS5042).
- Formatters rewrite hand-written docs (tables, emphasis markers); keep `*.md` out of the formatter (Prettier before, Oxfmt now).
- Vitest: a package with no tests needs `passWithNoTests` (also under `typecheck`).
- Obsolete since ADR-0011: `tseslint.config()` deprecation and projectService `allowDefaultProject` for config files.
## Application
Remove `passWithNoTests` from packages/react once TSK-012 adds tests.