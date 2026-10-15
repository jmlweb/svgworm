---
id: TSK-045
title: Fix: CheckOutcome.stale lists missing and changed files too
status: pending
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-005
depends-on: []
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

- [ ] Decision recorded: rename the field before 1.0 or keep it and document it (an ADR if the --json shape is treated as contract)
- [ ] If renamed: new field in CheckOutcome and check --json, stale kept as a deprecated alias for one minor, changeset added, reporter snapshots updated
- [ ] Either way: the site cli docs and llms.txt describe the check --json fields

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created