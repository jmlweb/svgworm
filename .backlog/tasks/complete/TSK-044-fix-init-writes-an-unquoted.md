---
id: TSK-044
title: Fix: init writes an unquoted --config path into package.json scripts
status: complete
priority: P4
tags: []
created: 2026-10-15
source: report/RPT-004
depends-on: []
started: 2026-10-15
completed: 2026-10-15
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

- [x] svgworm init rejects a --config, --source, --out-dir, --module-dir or --component-file path with whitespace or shell metacharacters, with a clear message (or quotes it correctly) — evidence: plan.test.ts rejects {configFile: my icons.json}, {sources: [icons;rm]}, {outDir: public/$x} → pass; message names spaces and shell characters (2026-10-15)
- [x] The --config flag text for scripts and next steps comes from one helper — evidence: plan.ts: configFlag(options) feeds both buildCommand and the next steps; no other --config interpolation remains (2026-10-15)
- [x] A test covers a config path with a space — evidence: plan.test.ts: rejects {"configFile":"my icons.json"} → pass (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] pathProblem now uses UNSAFE_IN_PATH (whitespace, quotes, backticks, backslash, $&|;<>()*?#!~). Changeset init-rejects-unsafe-paths.md. pnpm vitest run src/cli → 136 passed; lint, format, typecheck exit 0.
- [2026-10-15] Completed