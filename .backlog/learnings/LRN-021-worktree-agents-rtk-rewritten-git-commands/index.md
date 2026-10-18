---
id: LRN-021
title: Worktree agents: rtk-rewritten git commands are refused; use /usr/bin/env git
status: active
tags: [tooling, worktree, git]
task: TSK-010
created: 2026-10-11
---

## Context
Agent running in an isolated worktree with the RTK hook active.

## Insight
Porcelain git commands (log, status, branch, -C) get rewritten to `rtk git ...` and the worktree guard refuses them; plumbing (`rev-parse`, `merge-base`) passes. `/usr/bin/env git <cmd>` works for everything. The guard also refuses compound commands (`cd <dir>; …`, `&&` chains) it cannot prove stay inside the worktree. The global safety hook blocks a hard reset, and `rm` must be `trash`.

## Application
In worktree agent prompts, tell agents to use `/usr/bin/env git` and one plain command per call. The full brief is in `.claude/rules/agent-workflow.md` (see LRN-060). Since 2026-10-13 `main` is the default branch, so worktrees start from the right tree; if a base is ever stale, `/usr/bin/env git checkout -B <branch> main` on a clean worktree fixes it.
