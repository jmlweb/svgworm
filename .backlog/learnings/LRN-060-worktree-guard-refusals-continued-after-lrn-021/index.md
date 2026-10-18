---
id: LRN-060
title: Worktree-guard refusals continued after LRN-021: the rule must be in the agent prompt
status: active
tags: [workflow, worktree, agents, git]
task: 
created: 2026-10-18
---

## Context
Session transcripts from 2026-10-07 to 2026-10-17 show 84 worktree-guard refusals in isolated subagents: 37 before LRN-021 was recorded (2026-10-07 and 2026-10-08), 9 on 2026-10-11, the day it was recorded, and 37 on 2026-10-15 alone, during a parallel backlog run. The refused commands were compound (`cd <dir>; …`, `&&` chains) or rewritten git porcelain.

## Insight
Subagents don't read the backlog learnings or inherit the main session's rules, so a learning about subagent behaviour never reaches the subagent. LRN-016 and LRN-026 (worktrees based on the wrong branch) are obsolete since `main` became the default branch on 2026-10-13.

## Application
Paste the worktree subagent brief from `.claude/rules/agent-workflow.md` into every `isolation: worktree` prompt: one plain command per call, `/usr/bin/env git`, `pnpm install` first, check the base, no shared files. When a learning is about how agents should behave, also put it in a rules file or the prompt template.
