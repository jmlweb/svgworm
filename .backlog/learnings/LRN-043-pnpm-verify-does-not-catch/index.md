---
id: LRN-043
title: pnpm verify does not catch stale committed example or site output
status: active
tags: [testing, ci, example, output]
task: TSK-064
created: 2026-10-15
---

## Context
TSK-064 found `pnpm example:check` red on main: commit 0d9632a changed sprite bytes (license comments) but the committed example output was not rebuilt.
## Insight
`pnpm verify` skips the example and the site, so a core change that alters output bytes passes verify while the committed example sprite goes stale. CI catches it, locally nothing does.
## Application
After any core change that can alter sprite bytes, run `pnpm example:check` and `pnpm site:check` before committing, and rebuild their committed output in the same commit.
