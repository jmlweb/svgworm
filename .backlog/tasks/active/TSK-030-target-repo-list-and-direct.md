---
id: TSK-030
title: Target repo list and direct migration PRs
status: blocked
priority: P2
tags: [traction, outreach]
created: 2026-10-07
source: manual
depends-on: [TSK-018]
started: 2026-10-12
blocked-by: Maintainer outreach: migration PRs to external repos must be opened by the maintainer
---

# Target repo list and direct migration PRs

## Description

Direct path to the target user and to the "5 distinct external people" kill criterion (ADR-0005, docs/traction.md). The list can be built before launch; PRs wait for the v0.1.0 release.


## Acceptance Criteria

- [x] List of ~20 public Next.js App Router repos or design systems with a custom SVG icon folder, ranked by fit
- [x] Search queries used are recorded so the list is reproducible
- [ ] At least 5 migration PRs opened after v0.1.0, each showing bundle/HTML size diff
- [ ] Opened/merged counts logged in the weekly metrics snapshot

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] docs/outreach/target-repos.md: 20 repos ranked by App Router, icon SVG count, activity and stars, from four reproducible gh code searches on @svgr/webpack in Next configs; two starter templates flagged first. Criteria 3-4 (PRs, counts) wait for v0.1.0 on npm.- [2026-10-13] Unblocked: svgworm@0.1.0 and @svgworm/react@0.1.0 are on npm (TSK-018 complete). The npm-dependent criteria can start.
- [2026-10-15] Blocked: Maintainer outreach: migration PRs to external repos must be opened by the maintainer
