---
id: LRN-009
title: Hand-edited task title or priority leaves index stale
status: active
tags: [backlog, flowstate, index]
task: TSK-014
created: 2026-10-07
---

## Context

Re-planning backlog tasks by editing frontmatter directly (title, priority, tags) in `.backlog/tasks/pending/`. The CLI commands task-create and task-move keep `tasks/index.md` in sync, but direct file edits do not.

## Insight

After hand-editing any task's title, priority or tags, `tasks/index.md` still shows the old values. Run `flowstate index-rebuild` to regenerate the index from disk.

## Application

Batch-edit task files, then run `flowstate index-rebuild` before committing. Check with `grep TSK-00X .backlog/tasks/index.md`.
