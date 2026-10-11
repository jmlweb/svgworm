---
id: TSK-010
title: Scaffold project per stack ADR
status: active
priority: P2
tags: [setup]
created: 2026-10-07
source: manual
depends-on: [TSK-009]
started: 2026-10-07
---

# Scaffold project per stack ADR

## Description

Create package(s), lint/format/test/build, CI (lint, test, typecheck, determinism check). Update AGENTS.md with commands.

## Acceptance Criteria

- [x] Fresh clone: install + test + build pass
- [ ] CI runs on PR on Linux, macOS and Windows
- [ ] Determinism check runs on all three operating systems
- [x] AGENTS.md lists commands

## Notes

## Learnings

- LRN-020: Scaffold gotchas: typescript-eslint 8.70 config API, TS 7 via pnpm dlx, Prettier rewrites docs
- LRN-021: Worktree agents: rtk-rewritten git commands are refused; use /usr/bin/env git
- LRN-022: Oxlint config gotchas: no extends in overrides, no restricted-properties, typeAware root-only
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-11] Scaffold cherry-picked onto next (branch chore/TSK-010-scaffold); learnings renumbered to LRN-020 and LRN-021 with the flowstate CLI.
- [2026-10-11] Replaced ESLint, typescript-eslint and Prettier with Oxlint, Oxfmt and the shared @jmlweb configs (tsconfig-node, vitest-config, commitlint-config + husky commit-msg hook); ADR-0011 supersedes the lint/format row of ADR-0008.
- [2026-10-11] Fresh clone of the branch: install --frozen-lockfile, lint (planted floating promise reported, so type-aware is active), format:check, typecheck, typecheck:ts7, build, test and check:packages all pass.
- [2026-10-11] CI updated (Oxc tools, commitlint over the PR range). Unverified until pushed; criteria 2 and 3 stay open until a run on GitHub.
- [2026-10-11] AGENTS.md (commands, ADR-0011 bullet) and CONTRIBUTING.md updated. Tests: the existing determinism, Unicode and collision tests carry over; no new product code, the boundary rules were checked with planted violations instead.