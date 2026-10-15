---
id: TSK-093
title: SVGR migration: svgworm migrate svgr codemod and guide
status: pending
priority: P3
tags: [migration, svgr, codemod, docs, cli, competitors]
created: 2026-10-15
source: manual
depends-on: []
---

# SVGR migration: svgworm migrate svgr codemod and guide

## Description

Competitor gap: SVGR (21.6M weekly downloads) is the largest pool of possible switchers. Its users import SVGs per file (`import Logo from './logo.svg'`), scattered across the repo. Collecting the files already works through `sources` globs (ADR-0020). The switching cost is rewriting every import and JSX use.

Approach: a `migrate svgr` subcommand in `packages/svgworm/src/cli/commands`. It reads the config, maps each imported path to the name the core derives (reuse `naming.ts`), and rewrites JSX. It prefers a parser that is already reachable (for example the TypeScript compiler API, if it is available without a runtime dependency). Otherwise it raises the dependency question. The guide also documents the hard limit: a `<use>` shadow tree cannot style or animate inner paths, and ADR-0024 rejects an inline sprite, so animated icons stay on SVGR.

Do after RPT-007.

## Acceptance Criteria

- [ ] svgworm migrate svgr rewrites default and named imports of .svg files used as components into <Icon name="…"/> calls, mapping each import path to the icon name svgworm derives; a dry run is the default and --write applies the changes
- [ ] Imports it cannot convert (props on inner paths, refs, animated icons, svg files outside the configured sources) are listed with file:line and left untouched; exit codes follow the CLI contract
- [ ] No new runtime dependency, or an ADR justifies one within the ADR-0008 cap of 3
- [ ] Snapshot tests on a fixture project cover default import, named ReactComponent import, aliasing, and unconvertible cases; plain and --json reporters snapshotted
- [ ] A site migration guide (SVGR to svgworm) covers next.config/turbopack.rules removal, the codemod, and the limit that a <use> sprite cannot style or animate inner paths (keep SVGR for those icons); comparison.md links it; changeset added

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created