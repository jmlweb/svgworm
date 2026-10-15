---
id: TSK-062
title: Actionable errors: did-you-mean and fix hints
status: pending
priority: P3
tags: [cli, errors, react, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Actionable errors: did-you-mean and fix hints

## Description

Dogfooding 0.2.1: `--sources` prints the Node parseArgs text about positional arguments. Collisions name the files but not the fix. `Unknown icon "home"` at runtime gives no suggestion (Astro check already says "Did you mean"). Invalid XML shows `<input>:2:0: Unclosed root tag`.

## Acceptance Criteria

- [ ] Unknown CLI flags suggest the closest known flag (e.g. --sources to --source) instead of the raw parseArgs text
- [ ] name/collision errors say how to fix (rename, drop --flatten, or folders)
- [ ] The @svgworm/react Unknown icon runtime error suggests the closest names
- [ ] svg/invalid-xml messages do not show <input> as the location
- [ ] Tests cover each message

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created