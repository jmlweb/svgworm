---
id: TSK-032
title: Agent eval harness: guided success and unprompted pick rate
status: complete
priority: P3
tags: [traction, agents, measure]
created: 2026-10-07
source: manual
depends-on: [TSK-016, TSK-017]
started: 2026-10-12
completed: 2026-10-12
---

# Agent eval harness: guided success and unprompted pick rate

## Description

Agent track item 5 of docs/traction.md. Guided success measures docs and CLI quality (controllable). Unprompted pick rate is a lagging signal, tracked but not targeted.


## Acceptance Criteria

- [x] Fixture: Next.js app plus a folder of SVGs and a task prompt
- [x] Guided run: agent told to use svgworm; pass means app builds and icons render
- [x] Unprompted run: agent only asked to add icons; records which tool it picked
- [x] Results written to the weekly metrics log
- [x] Guided run usable as a docs regression check

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] evals/agent: fixture Next app + icons, prompts/guided.md and prompts/unprompted.md, run.mjs (claude -p with allowed tools, --local links the repo packages until v0.1.0, budget and turn caps), check.mjs (build passes, icons in prerendered HTML, no icon code in client chunks for svgworm, records the picked tool). Appends to docs/metrics/agent-eval.jsonl and manual.json agentEval, which the weekly snapshot reads. Dry run verified; no paid run yet (maintainer decision).
- [2026-10-12] Completed