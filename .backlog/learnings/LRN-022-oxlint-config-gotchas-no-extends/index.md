---
id: LRN-022
title: Oxlint config gotchas: no extends in overrides, no restricted-properties, typeAware root-only
status: active
tags: [tooling, oxlint, lint, monorepo]
task: TSK-010
created: 2026-10-11
---

## Context
Migrating the TSK-010 scaffold from ESLint to Oxlint 1.87 with @jmlweb/oxlint-config-node.
## Insight
- `overrides[]` entries reject `extends`. A package that needs another shared config (react) gets a nested `oxlint.config.ts`; the nearest config replaces the root rules for that directory.
- `options.typeAware` is read only from the root config, and a missing one skips type-aware rules silently. Prove it with a planted floating promise.
- No `no-restricted-properties` rule: forbid the whole `process` global with `no-restricted-globals` to keep `process.stdout` out of src/core.
- `pnpm exec oxlint --rules` prints nothing; check a rule by planting a violation.
- `oxfmt` formats Markdown and rewrites hand-written docs; exclude `**/*.md` in `ignorePatterns`.
- n/hashbang on a bin source: set `settings.n.convertPath` (src to dist) in the root config. n/no-missing-import on scripts that import `dist/`: turn it off for those scripts.
- @jmlweb/commitlint-config before 4.1.0 forced lower-case subjects and rejected `(TSK-010)`; 4.1.0 fixes it.
## Application
Check every new boundary rule with a planted violation before relying on it.