---
id: TSK-015
title: svgworm init: interactive setup for Next.js
status: pending
priority: P2
tags: [cli, dx, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-011, TSK-012]
---

# svgworm init: interactive setup for Next.js

## Description

Interactive in a TTY, fully driven by flags otherwise (R-56). Writes the config, adds predev and prebuild scripts, and creates the Next.js Icon wiring. Adoption depends on the first five minutes (PLN-001 step 11).

## Acceptance Criteria

- [ ] Run with flags and no TTY completes without prompts
- [ ] Writes config, predev/prebuild scripts and Icon wiring in a Next.js 16 app
- [ ] Re-running is idempotent
- [ ] Stable exit codes and --json output

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created