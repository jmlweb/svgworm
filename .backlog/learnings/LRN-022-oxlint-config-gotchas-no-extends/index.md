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
- @jmlweb/commitlint-config forces lower-case subjects, which rejects `(TSK-010)`; turn `subject-case` off.
- n/no-missing-import fails on scripts that import `dist/` before the build; n/hashbang fails on a bin source whose `bin` points to dist.
## Application
Check every new boundary rule with a planted violation before relying on it.