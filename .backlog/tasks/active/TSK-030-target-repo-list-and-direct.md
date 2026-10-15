---
id: TSK-030
title: Target repo list and direct migration PRs
status: active
priority: P2
tags: [traction, outreach]
created: 2026-10-07
source: manual
depends-on: [TSK-018]
started: 2026-10-12
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
- [2026-10-15] Unblocked: Maintainer chose to keep maintainer-only outreach active; agent prepares paste-ready material, maintainer publishes
- [2026-10-15] Enterwell/react-starter (#13) checked in a scratch clone: no icon imports to migrate (favicon URLs only; SVGR used only by Storybook; last human commit 2024-01-10). No PR: client JS and HTML identical before and after. The migration surfaced first-run friction, filed as RPT-007. Real-world bench re-run 2026-10-16 matches the draft numbers; the browser check on those folders found RPT-006, so the numbers post is on hold.
