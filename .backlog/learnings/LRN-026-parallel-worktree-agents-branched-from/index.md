---
id: LRN-026
title: Parallel worktree agents branched from main, not the current branch
status: active
tags: [worktree, parallel, flowstate, git]
task: TSK-017
created: 2026-10-12
---

## Context
/flowstate:parallel launched two subagents with isolation: worktree while work lived on branch `next`. Both worktrees held the old prototype (HEAD e40ad5f from `main`), with no docs/, packages/ or .backlog/. Git was also blocked inside the worktrees by the rtk hook, so the agents could not repair the base.
## Insight
Worktree isolation branches from the repo default branch, not the checked-out branch. While `main` holds the old prototype, every worktree agent starts on the wrong tree.
## Application
Until `next` is merged into `main`, do parallel tasks sequentially in the main thread, or create worktrees manually from `next`. Before dispatching, confirm the worktree base has AGENTS.md and packages/.
