---
id: LRN-066
title: Check git log for a fix landed outside the task before implementing it
status: active
tags: [testing, backlog, ci]
task: TSK-102
created: 2026-11-12
---

TSK-102 (add explicit vi.waitFor timeouts in watch.test.ts) was already implemented by commit 73024f2 (#28), which cited the testing rule and RPT-009 but not the task, so the task stayed pending. Before starting a fix task, run 'git log --oneline -- <file named in the task>' and grep the file: the fix may have landed under another commit. Close such a task with evidence pointing at that commit and the CI run on main.
