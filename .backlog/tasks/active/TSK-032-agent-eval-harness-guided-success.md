---
id: TSK-032
title: Agent eval harness: guided success and unprompted pick rate
status: active
priority: P3
tags: [traction, agents, measure]
created: 2026-10-07
source: manual
depends-on: [TSK-016, TSK-017]
started: 2026-10-12
---

# Agent eval harness: guided success and unprompted pick rate

## Description

Agent track item 5 of docs/traction.md. Guided success measures docs and CLI quality (controllable). Unprompted pick rate is a lagging signal, tracked but not targeted.


## Acceptance Criteria

- [ ] Fixture: Next.js app plus a folder of SVGs and a task prompt
- [ ] Guided run: agent told to use svgworm; pass means app builds and icons render
- [ ] Unprompted run: agent only asked to add icons; records which tool it picked
- [ ] Results written to the weekly metrics log
- [ ] Guided run usable as a docs regression check

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started