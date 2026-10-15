---
id: TSK-056
title: Clear error when no config and no --source
status: pending
priority: P2
tags: [cli, errors, onboarding, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Clear error when no config and no --source

## Description

Dogfooding 0.2.1: plain `npx svgworm` before init, or from a subdirectory, prints `svgworm: Invalid configuration ✖ Invalid input: expected array, received undefined → at sources`. It is the most likely first error a user sees and it does not say what to do. See LRN-040.

## Acceptance Criteria

- [ ] svgworm with no svgworm.config.json and no --source prints: no config found in <cwd>, run svgworm init or pass --source <dir> (exit 2 kept)
- [ ] When run from a subdirectory of a project that has a config, the message names the nearest config found above cwd
- [ ] Raw zod issue text is no longer shown for this case; other config errors keep their key path
- [ ] Plain and --json reporter snapshots updated

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created