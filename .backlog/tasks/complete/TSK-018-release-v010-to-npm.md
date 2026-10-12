---
id: TSK-018
title: Release v0.1.0 to npm
status: complete
priority: P2
tags: [release, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-009, TSK-010]
completed: 2026-10-12
started: 2026-10-12
---

# Release v0.1.0 to npm

## Description

npm provenance, changelog, GitHub release. Needs an explicit go from the maintainer before publishing (PLN-001 step 14). Target date: 2026-11-26 (TSK-014). Record the launch date when published; it starts the 12-week clock.

## Acceptance Criteria

- [x] Explicit go from the maintainer received before publish
- [x] npm provenance enabled (release.yml publishes through npm trusted publishing with NPM_CONFIG_PROVENANCE; the hand-published 0.1.0 tarballs carry no attestation, the first workflow release will)
- [x] Changelog and GitHub release written
- [x] Launch date recorded (2026-10-13, docs/metrics/manual.json)

## Notes

## Learnings

- LRN-032: First npm publish: dry-run first, expect staging, bin paths without ./
## Progress Log

- [2026-10-07] Created
- [2026-10-12] Prepared (commit pending review): .github/workflows/release.yml (Changesets version PR, publish through npm trusted publishing with NPM_CONFIG_PROVENANCE, GitHub releases) and docs/release.md with the one-time npm setup (create org svgworm, first publish by hand, trusted publisher per package on release.yml, disable tokens) and the post-release checks. Criteria 1-4 need the maintainer: the go, the npm org and trusted publisher config, the first run, and the launch date.
- [2026-10-13] Released 0.1.0 ahead of the 2026-11-26 target on the maintainer's go. Pre-release code + security review fixes landed first (a9aff9d..06717f1). Branches renamed: next -> main (default, release branch), old prototype main -> prototype. npm org `svgworm` created; Version PR #3 merged by rebase (8c13fd2); first publish by hand with 2FA from the maintainer's terminal. npm staged `svgworm` (placeholder 0.0.0-stage, approved on npmjs.com); `@svgworm/react` published directly. A dry run caught npm 11.6 dropping a `bin` path that starts with `./` (fixed in 06717f1 before publish). Tags svgworm@0.1.0 and @svgworm/react@0.1.0 pushed, GitHub releases created from the changelogs. Smoke test from a clean folder: install, `svgworm init --yes --agents-md`, build, `check` exit 0, manifest import OK. release.yml split into check/version/publish with the `npm-publish` environment (required reviewer). Still with the maintainer: trusted publishers on both packages (environment `npm-publish`), disable token publishing, manual Safari/iOS check, deprecate the two 0.0.0-stage placeholders.
- [2026-10-12] Completed
