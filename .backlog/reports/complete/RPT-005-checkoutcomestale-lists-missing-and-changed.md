---
id: RPT-005
title: CheckOutcome.stale lists missing and changed files too
type: improvement
severity: low
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-045
---

## Summary
The public `CheckOutcome.stale` field (and the `stale` key in `svgworm check --json`) holds every entry: `missing`, `changed` and `stale`. One of its own statuses is also called `stale`.

## Details
`packages/svgworm/src/core/check.ts:37` documents it as "Expected files first, in write order, then stale sprites". `check()` fills it with `[...expected, ...stale]` (`check.ts:154`). `CheckOutcome` is exported from `core/api.ts`. The JSON reporter prints it as `stale` (`cli/reporters/json.ts:42`). The site docs don't name the JSON field yet.

A consumer reading `result.stale` expects files a build would delete. They get a mix and must filter on `status`.

## Current behavior
`stale: CheckEntry[]` with `status: 'missing' | 'changed' | 'stale'`.

## Proposed change
Rename it to `entries` or `differences` before 1.0, keep `stale` as a deprecated alias for one minor, and record a changeset. If the `--json` shape counts as a contract, write an ADR. Otherwise document the current meaning in the CLI docs.

## Expected benefit
The field says what it holds. The rename is cheap now and a breaking change after 1.0.
