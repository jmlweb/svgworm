---
id: TSK-033
title: Weekly traction metrics snapshot
status: complete
priority: P3
tags: [traction, measure]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-12
completed: 2026-10-12
---

# Weekly traction metrics snapshot

## Description

Leading indicators from docs/traction.md Metrics. Steering only; the ADR-0005 kill criteria do not change. Extends the TSK-020 script plan so the 12-week review has history.


## Acceptance Criteria

- [x] Script records npm weekly downloads, distinct external issue/PR authors, stars, GitHub traffic referrers
- [x] Appends to a committed log so history survives the 14-day GitHub traffic window
- [x] Runs weekly (scheduled routine or documented manual step)
- [x] TSK-020 review reuses this script

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] scripts/traction-snapshot.mjs records npm downloads (last week and 4-week average), distinct external issue/PR authors (maintainers and bots excluded), stars, forks, 14-day views, clones and referrers, plus docs/metrics/manual.json (starters, target-list PRs, agent eval, launch date). Appends to docs/metrics/traction.jsonl. .github/workflows/traction.yml runs it every Monday and commits the row; --review prints the ADR-0005 verdict for TSK-020. Dry run verified locally.
- [2026-10-12] Completed