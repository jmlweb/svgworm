---
id: TSK-059
title: Spike: select icons from icon packages (include/exclude)
status: complete
priority: P2
tags: [spike, config, output-contract, adr, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Spike: select icons from icon packages (include/exclude)

## Description

Dogfooding 0.2.1: the most common icon source is a package such as lucide-static or @tabler/icons, but there is no include/exclude filter, so users copy files out of node_modules. Pointing sources at a whole set works (8 popular sets, ~18k files, all built clean in ~1 s) but makes huge sprites: tabler 2.4 MB, simple-icons 4.3 MB. Changes the config contract, so it needs an ADR.

## Acceptance Criteria

- [x] ADR decides how users pick a subset of icons from a package folder (e.g. include/exclude globs per source, or an icons list) and its effect on names — evidence: docs/adr/0020-select-icons-from-a-source-with-include-and-exclude-globs.md (accepted): sources entries may be { dir, include, exclude } with globs on the path inside dir; names unchanged; prefix deferred (2026-10-15)
- [x] Prototype shows lucide-static / @tabler/icons subsets building without copying files — evidence: built CLI in a scratch project with lucide-static 1.57.0 and @tabler/icons 3.49.0: 12 Lucide icons → 3.1 KiB, arrow-* minus big → 62 icons 13.8 KiB, full Lucide 2,154 icons 643.8 KiB, Tabler 10 → 2.9 KiB, full outline 5,184 → 1,792.5 KiB; collision with an own house.svg reported with the fix hint; numbers in the ADR (2026-10-15)
- [x] Config schema, docs and llms.txt updated if accepted — evidence: schema.ts union + JSON schema regenerated (schema test passes), config.md Icons from a package section, llms.txt, both skills; changeset sources-include-exclude.md (minor) (2026-10-15)
- [x] docs/open-questions.md updated — evidence: docs/open-questions.md Q-52 added as resolved by ADR-0020 (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Implemented as product code with tests (schema, resolve, discover incl. symlinked folder, CLI end-to-end) rather than a throwaway spike. Also fixed two lint findings left by the docs-page script and the CSP script. 503 tests pass; lint, typecheck, site:check pass.
- [2026-10-15] Completed