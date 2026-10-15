---
id: TSK-056
title: Clear error when no config and no --source
status: complete
priority: P2
tags: [cli, errors, onboarding, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Clear error when no config and no --source

## Description

Dogfooding 0.2.1: plain `npx svgworm` before init, or from a subdirectory, prints `svgworm: Invalid configuration ✖ Invalid input: expected array, received undefined → at sources`. It is the most likely first error a user sees and it does not say what to do. See LRN-040.

## Acceptance Criteria

- [x] svgworm with no svgworm.config.json and no --source prints: no config found in <cwd>, run svgworm init or pass --source <dir> (exit 2 kept) — evidence: resolve.test.ts: says what to do when there is no config file and no --source; run.test.ts exits 2 for no sources at all → pass (2026-10-15)
- [x] When run from a subdirectory of a project that has a config, the message names the nearest config found above cwd — evidence: resolve.test.ts: names the nearest config file above cwd → pass (2026-10-15)
- [x] Raw zod issue text is no longer shown for this case; other config errors keep their key path — evidence: resolve.test.ts: keeps the key path for other config errors; message asserts no expected array → pass (2026-10-15)
- [x] Plain and --json reporter snapshots updated — evidence: new snapshots plain-no-config.txt and json-no-config.json; pnpm vitest run src/cli → 185 passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Implemented in core/config/resolve.ts: loadConfig throws a ConfigError with a fix hint when no file and no sources override; findConfigAbove names the nearest config in a parent folder. Changeset missing-config-hint.md. pnpm lint, format, typecheck exit 0.
- [2026-10-15] Completed