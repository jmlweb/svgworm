---
id: LRN-016
title: Agent worktrees may be created from main, not next
status: active
tags: [workflow, agents, git]
task: TSK-009
created: 2026-10-07
---

## Context
In the TSK-002/006/009 parallel run, agent worktrees started on `main` (old prototype) while the working branch is `next`.
## Insight
The worktree base is not the current branch of the main checkout. Agents read stale docs unless they rebase onto `next`.
## Application
Before launching parallel agents, make sure worktrees are based on `next`, or tell each agent to verify its base first and stop if it's wrong.
