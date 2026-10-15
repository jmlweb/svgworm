---
id: RPT-004
title: init writes an unquoted --config path into package.json scripts
type: bug
severity: low
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-044
---

## Summary
`svgworm init --config "my icons.json"` passes validation. It then writes `svgworm --config my icons.json` into `predev`/`prebuild`, and the scripts break.

## Details
`pathProblem` (`packages/svgworm/src/cli/init/plan.ts:597`) rejects quotes, backticks, backslashes and line breaks, but not whitespace or other shell metacharacters. `buildCommand` (`plan.ts:331`) and `configFlag` (`plan.ts:724`) interpolate `options.configFile` without quoting. The same `--config` string is also built twice; both should come from one helper.

## Steps to Reproduce
1. `svgworm init --config "my icons.json" --yes` in a project with a package.json.
2. `npm run dev`.

## Expected vs Actual
- Expected: either init rejects the path, or the script quotes it and runs.
- Actual: the script runs `svgworm --config my icons.json`. Then `icons.json` is an unexpected argument (exit 2), or the wrong file is read.

## Error messages/logs
A usage error from `svgworm` on the extra positional argument.

## Fix
Reject whitespace and shell metacharacters in `pathProblem` (simplest, and consistent with the quote rule), or quote the path. Reuse `buildCommand` for the next-steps text.
