---
id: TSK-044
title: Fix: init writes an unquoted --config path into package.json scripts
status: pending
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-004
depends-on: []
---

# Fix: init writes an unquoted --config path into package.json scripts

## Description

### Summary
`svgworm init --config "my icons.json"` passes validation, then writes `svgworm --config my icons.json` into `predev`/`prebuild`. The CLI accepts positionals (`cli/args.ts:88`), so the script fails with `unknown command "icons.json"` (exit 2).

### Key details
- `pathProblem` (`packages/svgworm/src/cli/init/plan.ts:597`) rejects quotes, backticks, backslashes and line breaks, but not whitespace or shell metacharacters.
- `buildCommand` (`plan.ts:331`) and `configFlag` (`plan.ts:724`) interpolate `options.configFile` unquoted, and build the same string twice.
- Simplest fix: reject whitespace and shell metacharacters in `pathProblem`, consistent with the quote rule.

Source: RPT-004.

## Acceptance Criteria

- [ ] svgworm init rejects a --config, --source, --out-dir, --module-dir or --component-file path with whitespace or shell metacharacters, with a clear message (or quotes it correctly)
- [ ] The --config flag text for scripts and next steps comes from one helper
- [ ] A test covers a config path with a space

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created