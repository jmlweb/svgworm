---
id: TSK-015
title: svgworm init: interactive setup for Next.js
status: complete
priority: P2
tags: [cli, dx, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-011, TSK-012]
started: 2026-10-12
completed: 2026-10-12
---

# svgworm init: interactive setup for Next.js

## Description

Interactive in a TTY, fully driven by flags otherwise (R-56). Writes the config, adds predev and prebuild scripts, and creates the Next.js Icon wiring. Adoption depends on the first five minutes (PLN-001 step 11).

## Acceptance Criteria

- [x] Run with flags and no TTY completes without prompts
- [x] Writes config, predev/prebuild scripts and Icon wiring in a Next.js 16 app
- [x] Re-running is idempotent
- [x] Stable exit codes and --json output

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Added `svgworm init` (commit b0c6239): src/cli/init/plan.ts (pure plan from options + project facts), apply.ts (writes), prompts.ts (clack, TTY only), commands/init.ts.
- [2026-10-12] Criterion 1: non-TTY or --yes/--json runs with flags only, no prompts (run.test.ts). Criterion 2: writes svgworm.config.json with $schema, adds predev/prebuild (chains `svgworm && existing`), creates components/icon.tsx or src/components/icon.tsx with the relative manifest import when react or next is a dependency. Criterion 3: re-run reports every file unchanged; differing files are skipped, never overwritten. Criterion 4: exit 0/1/2, --json prints one document with actions and nextSteps.
- [2026-10-12] Also --agents-md appends a marked svgworm section to AGENTS.md (TSK-031 criterion 4). Interactive flow not covered by tests (CLI visuals exception in testing.md); plan logic has unit tests.
- [2026-10-12] Completed