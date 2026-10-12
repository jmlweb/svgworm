---
id: TSK-020
title: Kill-criteria review: launch + 12 weeks
status: pending
priority: P3
tags: [measure, adr]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
---

# Kill-criteria review: launch + 12 weeks

## Description

ADR-0005 criteria, reviewed 12 weeks after v0.1.0: at least 500 weekly npm downloads (four-week average); at least 5 issues or PRs from distinct external people; one public starter or template adopts it. Script: npm downloads from api.npmjs.org, distinct external authors via gh excluding maintainers, starter list by hand. Output: short report and a continue-or-stop ADR. Optional scheduled cloud routine reminder. Planned date: 2027-02-18 if v0.1.0 ships on its 2026-11-26 target; recompute from the actual launch date.

## Acceptance Criteria

- [x] Script computes the three criteria
- [ ] Report and continue-or-stop ADR written
- [ ] Review date derived from the recorded launch date

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Criterion 1 met by TSK-033: `node scripts/traction-snapshot.mjs --review` computes the three ADR-0005 criteria and the review date from manual.json launchDate. Report and ADR wait for launch + 84 days.