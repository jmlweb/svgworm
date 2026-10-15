---
id: TSK-045
title: Fix: CheckOutcome.stale lists missing and changed files too
status: complete
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-005
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Fix: CheckOutcome.stale lists missing and changed files too

## Description

### Summary
The public `CheckOutcome.stale` field, and the `stale` key in `svgworm check --json`, holds every entry (`missing`, `changed`, `stale`), and one of its own statuses is also `stale`.

### Key details
- `packages/svgworm/src/core/check.ts:37` documents it as "Expected files first, in write order, then stale sprites"; `check()` fills it with `[...expected, ...stale]` (`check.ts:154`).
- `CheckOutcome` is exported from `core/api.ts`; the JSON reporter prints it as `stale` (`cli/reporters/json.ts:42`).
- The site docs and `llms.txt` don't name the JSON fields yet, so a rename is cheap now and breaking after 1.0.
- Suggested names: `entries` or `differences`.

Source: RPT-005.

## Acceptance Criteria

- [x] Decision recorded: rename the field before 1.0 or keep it and document it (an ADR if the --json shape is treated as contract) — evidence: Decision: rename before 1.0; --json is not part of docs/output-contract.md (generated files only), so a changeset and docs note suffice, no ADR (2026-10-15)
- [x] If renamed: new field in CheckOutcome and check --json, stale kept as a deprecated alias for one minor, changeset added, reporter snapshots updated — evidence: CheckOutcome.differences + deprecated stale alias (same array); json reporter prints both; check.test.ts asserts stale is differences; snapshot json-check-stale.json updated; changeset check-differences-field.md (minor) (2026-10-15)
- [x] Either way: the site cli docs and llms.txt describe the check --json fields — evidence: apps/site/src/content/docs/cli.md check section lists the --json fields; llms.txt --json bullet names differences, iconDiff and the alias (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Renamed to differences with stale kept as a deprecated alias for one minor. Decision: no ADR, the --json document is a CLI surface outside the output contract; recorded here and in the changeset. Tests 136 passed; lint, format, typecheck exit 0.
- [2026-10-15] Completed