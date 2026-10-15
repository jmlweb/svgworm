---
id: TSK-061
title: Quiet plain reporter: summary by default, --verbose for per-icon lines
status: complete
priority: P3
tags: [cli, ux, reporters]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Quiet plain reporter: summary by default, --verbose for per-icon lines

## Description

Dogfooding 0.2.1: the plain reporter prints `icon <name> <color> <delivery>` per icon on every build and check. With lucide it is 2,166 lines in each CI or predev run. Both agents flagged it as noise.

## Acceptance Criteria

- [x] Plain build output prints the summary and diagnostics, not one line per icon, by default — evidence: reporters.test.ts: prints the files written and the summary, not one line per icon (asserts no ^icon line) → pass; plain-success.txt snapshot updated (2026-10-15)
- [x] check prints the verdict without per-icon lines when up to date — evidence: reporters.test.ts: plain: prints the verdict alone when up to date (exact stdout) → pass (2026-10-15)
- [x] A --verbose flag (or equivalent) restores per-icon lines — evidence: args.test.ts takes --verbose; reporters.test.ts prints one line per icon with --verbose, snapshot plain-success-verbose.txt → pass (2026-10-15)
- [x] --json output is unchanged — evidence: json-success.json and json-check-stale.json snapshots unchanged (git status) (2026-10-15)
- [x] Non-TTY snapshots updated; docs and help updated — evidence: plain-success.txt and plain-check-stale.txt updated; help.ts, apps/site/src/content/docs/cli.md (Options and Output), llms.txt flags list (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Added --verbose (build, check, watch). selectReporter takes { isJson, isVerbose }; plain reporter prints icon lines only when verbose. Changeset quiet-plain-output.md (minor). 139 CLI tests pass; lint, format, typecheck exit 0.
- [2026-10-15] Completed