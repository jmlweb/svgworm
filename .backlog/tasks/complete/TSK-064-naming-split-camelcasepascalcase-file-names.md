---
id: TSK-064
title: Naming: split camelCase/PascalCase file names into kebab-case
status: complete
priority: P4
tags: [naming, output-contract, adr]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Naming: split camelCase/PascalCase file names into kebab-case

## Description

Dogfooding 0.2.1: `ArrowRight.svg` becomes `arrowright`. Figma and many designer exports use PascalCase, so names are hard to guess. Public-name change, so it needs an ADR.

## Acceptance Criteria

- [x] ADR decides whether ArrowRight.svg becomes arrow-right (today arrowright) — evidence: docs/adr/0021 accepted: keep arrowright, warn with arrow-left.svg (2026-10-15)
- [x] If accepted, naming tests and the output contract are updated with a semver note and changeset — evidence: naming.test.ts + compile.test.ts; .changeset/case-folded-warning.md (minor); output-contract updated (2026-10-15)

## Notes

## Learnings

- LRN-043: pnpm verify does not catch stale committed example or site output
## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Stopped on request. ADR-0021 drafted as proposed (docs/adr/0021-no-camel-case-splitting-warn-when-case-carried-meaning.md): keep ADR-0007 naming, add a name/case-folded warning with a suggested file name. Not done yet: the warning in core/naming.ts + compile.ts, tests, troubleshooting and skill table rows, changeset (minor), ADR status to accepted.
- [2026-10-15] Returned to pending
- [2026-10-15] Started
- [2026-10-15] Implemented ADR-0021: caseFoldedWarning in core/naming.ts, emitted from compile.ts as name/case-folded (warning + event). Tests first in naming.test.ts (suggestion, flatten, round-trip property) and compile.test.ts. Docs: output-contract, how-it-works, troubleshooting, both skills. Changeset minor. ADR-0021 accepted; Q-31 note in open-questions. pnpm verify, determinism:fingerprint, site:check, example:check green (example output was stale from 0d9632a, rebuilt in its own fix commit).
- [2026-10-15] Completed