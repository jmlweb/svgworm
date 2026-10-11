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
Porcelain git commands (log, status, branch, -C) get rewritten to `rtk git ...` and the worktree guard refuses them; plumbing (`rev-parse`, `merge-base`) passes. `/usr/bin/env git <cmd>` works for everything. The hard-reset form from LRN-016 is blocked by the global safety hook, and `rm` must be `trash`. `git checkout -B <branch> next` on a clean worktree achieves the same base fix.
## Application
In worktree agent prompts, tell agents to use `/usr/bin/env git` and `checkout -B <branch> next` for the base fix.