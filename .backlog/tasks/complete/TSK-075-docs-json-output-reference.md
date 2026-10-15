---
id: TSK-075
title: Docs: --json output reference
status: complete
priority: P3
tags: [docs, cli, agents]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: --json output reference

## Description

From the 2026-10-15 docs copy review. The docs promise `--json` output for scripts and AI agents (principle 10) but never show its shape, so consumers must reverse-engineer it. TSK-061 changes only the plain reporter, so there is no overlap.

## Acceptance Criteria

- [x] cli.md documents the JSON document printed by build, check, watch (one per build) and init, with an example of each — evidence: cli.md JSON output section: build, check, watch and init documents with an example each, taken from the reporter snapshots (2026-10-15)
- [x] It states which fields are stable before 1.0 and how changes are announced — evidence: cli.md JSON output > Stability: minor-only changes before 1.0, deprecated alias for one minor, changelog, fields added never reordered, durationMs varies (2026-10-15)
- [x] llms.txt links to it — evidence: llms.txt --json bullet summarizes the shapes and links to https://svgworm.com/docs/cli/#json-output (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check → checked 21 files and 7 pages, passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset.
- [2026-10-15] Completed