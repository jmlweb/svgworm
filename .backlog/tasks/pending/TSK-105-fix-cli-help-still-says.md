---
id: TSK-105
title: Fix: CLI help still says --cdn-url is React and Astro only after TSK-099
status: pending
priority: P4
tags: []
created: 2026-11-03
source: report/RPT-011
depends-on: []
---

# Fix: CLI help still says --cdn-url is React and Astro only after TSK-099

## Description

`packages/svgworm/src/cli/help.ts:45-46` still says `--cdn-url` is "React and Astro only", but TSK-099 / ADR-0036 made `init --cdn-url` write `SvgwormLoader.vue` and `SvgwormLoader.svelte`. Update the help line; `src/cli` only, so gate with `pnpm verify`. See RPT-011 for the reproduction.

## Acceptance Criteria

- [ ] svgworm --help describes --cdn-url as working for React, Astro, Vue and Svelte, matching apps/site/src/content/docs/cli.md
- [ ] A help test or snapshot fails if the line says React and Astro only again
- [ ] A changeset records the help text change

## Notes

## Learnings

## Progress Log

- [2026-11-03] Created