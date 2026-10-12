---
id: TSK-018
title: Release v0.1.0 to npm
status: pending
priority: P2
tags: [release, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-009, TSK-010]
---

# Release v0.1.0 to npm

## Description

npm provenance, changelog, GitHub release. Needs an explicit go from the maintainer before publishing (PLN-001 step 14). Target date: 2026-11-26 (TSK-014). Record the launch date when published; it starts the 12-week clock.

## Acceptance Criteria

- [ ] Explicit go from the maintainer received before publish
- [ ] npm provenance enabled
- [ ] Changelog and GitHub release written
- [ ] Launch date recorded

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Prepared (commit pending review): .github/workflows/release.yml (Changesets version PR, publish through npm trusted publishing with NPM_CONFIG_PROVENANCE, GitHub releases) and docs/release.md with the one-time npm setup (create org svgworm, first publish by hand, trusted publisher per package on release.yml, disable tokens) and the post-release checks. Criteria 1-4 need the maintainer: the go, the npm org and trusted publisher config, the first run, and the launch date.