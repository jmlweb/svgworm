---
id: TSK-059
title: Spike: select icons from icon packages (include/exclude)
status: pending
priority: P2
tags: [spike, config, output-contract, adr, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Spike: select icons from icon packages (include/exclude)

## Description

Dogfooding 0.2.1: the most common icon source is a package such as lucide-static or @tabler/icons, but there is no include/exclude filter, so users copy files out of node_modules. Pointing sources at a whole set works (8 popular sets, ~18k files, all built clean in ~1 s) but makes huge sprites: tabler 2.4 MB, simple-icons 4.3 MB. Changes the config contract, so it needs an ADR.

## Acceptance Criteria

- [ ] ADR decides how users pick a subset of icons from a package folder (e.g. include/exclude globs per source, or an icons list) and its effect on names
- [ ] Prototype shows lucide-static / @tabler/icons subsets building without copying files
- [ ] Config schema, docs and llms.txt updated if accepted
- [ ] docs/open-questions.md updated

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created