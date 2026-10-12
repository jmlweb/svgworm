---
id: TSK-017
title: Discovery docs and honest comparison page
status: complete
priority: P2
tags: [docs, discovery, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-011]
started: 2026-10-11
completed: 2026-10-12
---

# Discovery docs and honest comparison page

## Description

R-55. README with copy-pasteable quick start and npm keywords, llms.txt, JSON Schema for the config. Comparison page covering SVGR, @neodx/svg and vite-plugin-icons-spritesheet, with spike numbers and where each tool is the better choice (PLN-001 step 13).

## Acceptance Criteria

- [x] README with copy-pasteable quick start and npm keywords
- [x] llms.txt published
- [x] JSON Schema for the config published
- [x] Comparison page with spike numbers and where each tool wins

## Notes

## Learnings

- LRN-026: Parallel worktree agents branched from main, not the current branch
- LRN-027: React 19 prepends a preload link to server-rendered img
## Progress Log

- [2026-10-07] Created
- [2026-10-11] Started
- [2026-10-11] Commit 0da4021: README rewrite (quick start, CLI, config table), llms.txt, docs/comparison.md, package READMEs, npm keywords.
- [2026-10-11] JSON Schema: packages/svgworm/svgworm.schema.json generated from the zod schema (pnpm schema:generate), exported as svgworm/schema.json, test fails when stale.
- [2026-10-11] Comparison numbers come only from spikes TSK-002/003/004/006/007. SVGR and vite-plugin-icons-spritesheet were not benchmarked; the page says so.
- [2026-10-11] Not run: the README quick start end to end in a real Next app (TSK-016 covers it). Links and unpkg URL point at main/npm and work after merge and publish.
- [2026-10-12] Completed