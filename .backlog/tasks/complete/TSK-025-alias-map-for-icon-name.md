---
id: TSK-025
title: Alias map for icon name collisions
status: complete
priority: P4
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Alias map for icon name collisions

## Description

Deferred past v0.1. Q-32 alias map. v0.1 collisions are always an error (TSK-006, R-03).

## Acceptance Criteria

- [x] Decision on Q-32 recorded in an ADR — evidence: docs/adr/0025-no-alias-map-for-icon-names.md (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-15] Started
- [2026-10-15] ADR-0025 accepted: no alias map. Name stays a pure function of the path; rename own files, exclude package files. Counted 33,457 SVG names in six icon packages (npm pack): 0 camelCase, so ADR-0021's warning never fires on package sources. Two-package same-name case left to ADR-0020's per-source prefix. Docs: output-contract, open-questions Q-32, troubleshooting name collision.
- [2026-10-15] Completed