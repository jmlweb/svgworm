---
id: TSK-093
title: SVGR migration: svgworm migrate svgr codemod and guide
status: complete
priority: P3
tags: [migration, svgr, codemod, docs, cli, competitors]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-17
completed: 2026-10-17
---

# SVGR migration: svgworm migrate svgr codemod and guide

## Description

Competitor gap: SVGR (21.6M weekly downloads) is the largest pool of possible switchers. Its users import SVGs per file (`import Logo from './logo.svg'`), scattered across the repo. Collecting the files already works through `sources` globs (ADR-0020). The switching cost is rewriting every import and JSX use.

Approach: a `migrate svgr` subcommand in `packages/svgworm/src/cli/commands`. It reads the config, maps each imported path to the name the core derives (reuse `naming.ts`), and rewrites JSX. It prefers a parser that is already reachable (for example the TypeScript compiler API, if it is available without a runtime dependency). Otherwise it raises the dependency question. The guide also documents the hard limit: a `<use>` shadow tree cannot style or animate inner paths, and ADR-0024 rejects an inline sprite, so animated icons stay on SVGR.

Do after RPT-007.

## Acceptance Criteria

- [x] svgworm migrate svgr rewrites default and named imports of .svg files used as components into <Icon name="…"/> calls, mapping each import path to the icon name svgworm derives; a dry run is the default and --write applies the changes — evidence: svgr.test.ts + migrate.test.ts: default, ReactComponent as, ?react, @/ alias rewrites; dry run default, --write applies (migrate-page.tsx.txt snapshot) (2026-10-17)
- [x] Imports it cannot convert (props on inner paths, refs, animated icons, svg files outside the configured sources) are listed with file:line and left untouched; exit codes follow the CLI contract — evidence: skips listed file:line (value use, re-export, ref, children, fill/stroke, SVGR-only props, animated, outside sources, invalid, Icon clash); exit 1 when any left, 2 for usage/no component/no TS (2026-10-17)
- [x] No new runtime dependency, or an ADR justifies one within the ADR-0008 cap of 3 — evidence: typescript is an optional peer >=5.0.0 <7, no runtime dep; ADR-0035 (2026-10-17)
- [x] Snapshot tests on a fixture project cover default import, named ReactComponent import, aliasing, and unconvertible cases; plain and --json reporters snapshotted — evidence: plain-migrate.txt, plain-migrate.stderr.txt, json-migrate.json snapshots; pnpm verify exit 0 (840 tests) (2026-10-17)
- [x] A site migration guide (SVGR to svgworm) covers next.config/turbopack.rules removal, the codemod, and the limit that a <use> sprite cannot style or animate inner paths (keep SVGR for those icons); comparison.md links it; changeset added — evidence: apps/site/src/content/docs/migrate-from-svgr.md; comparison.md links it; .changeset/migrate-svgr-codemod.md; pnpm site:check exit 0 (2026-10-17)

## Notes

## Learnings

- LRN-058: TypeScript 7 has no JS compiler API, and an optional peer upper bound still breaks npm install
- LRN-059: getSymbolAtLocation on { Logo } and export { Logo } returns their own symbol, not the import
## Progress Log

- [2026-10-15] Created
- [2026-10-17] Started
- [2026-10-17] Decided with user: optional peer typescript >=5 <7 (TS 7.0.2 exports no JS compiler API), exit 1 while any import is left on SVGR. ADR-0035 accepted.
- [2026-10-17] Implemented src/cli/migrate (svgr.ts pure transform with checker-based references and text splicing, project.ts scan/index/resolver, typescript.ts loader, run.ts) plus commands/migrate.ts, args (migrate svgr, --write, scoped --component-file), help, plain/json/clack reporters.
- [2026-10-17] Evidence on tilt-dev/tilt web/ @2f0d1d1 (CRA, 54 svg imports): 25 uses in 12 files rewritten, 30 listed (20 value uses such as styled(), 9 fill, 1 Icon clash); --write changed only those 12 files.
- [2026-10-17] Fresh-context review fixes: shorthand and export { } uses, barrel re-exports reported, CRLF insertion, aliased Icon import reuse, type-only/nested/type Icon clashes, build-like folders only skipped at root, absolute --component-file. Kept: spread props convert (type-checked against IconProps, common in real code).
- [2026-10-17] Docs: site guide migrate-from-svgr, cli.md section and migrate JSON document, comparison link, docs index, llms.txt, README, AGENTS.md, architecture rule, changeset. pnpm verify, typecheck:ts7, site:check, format:check all exit 0.
- [2026-10-17] Completed