---
id: TSK-009
title: ADR: tech stack and package layout
status: complete
priority: P1
tags: [adr, tooling]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-07
completed: 2026-10-07
---

# ADR: tech stack and package layout

## Description

Resolve Q-40, Q-41, Q-42, Q-51. Choose runtime target, language, build, test runner, SVG parser/optimizer, CLI framework, config format, monorepo vs subpath exports, license. Evidence-based per .claude/rules/decisions.md.

Runs in parallel with M0 (TSK-014), so it no longer waits on TSK-008. Also covers release tooling (npm provenance, versioning) and the license (Q-51). Svgo evidence from TSK-003 feeds the parser and optimizer choice.

## Acceptance Criteria

- [x] One ADR per major choice or one consolidated ADR with evidence
- [x] Dependency budget justified
- [x] License decided
- [x] Release tooling chosen (npm provenance, versioning)
- [x] AGENTS.md phase line updated when this ADR is accepted (design to build)
- [x] CLI UX stack (progress, prompts, stats) chosen per principle 7 / R-53, with non-TTY fallback
- [x] Supported version range (runtime, browsers, React) stated per principle 8 / R-54

## Notes

## Learnings

- LRN-013: TypeScript 7 blocks type-aware linting
- LRN-014: Modern Node built-ins replace most CLI dependencies
- LRN-015: svgo has no public parse function
- LRN-016: Agent worktrees may be created from main, not next
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-07] Wrote ADR-0008 (accepted: stack, package layout, CLI UX, version range, 3-runtime-dep budget) and ADR-0009 (proposed: MIT pending user confirmation, Changesets fixed group, npm trusted publishing with provenance). Evidence: npm registry versions, Node 22/24 API docs, svgo benchmark (1,000 icons in 1.44 s, deterministic), install footprint (24 pkgs, 19.6 MB). Updated AGENTS.md phase, open-questions Q-40/41/42 resolved and Q-51 proposed, testing/architecture rules, README. Learnings LRN-013..016. Branch tsk-009-tech-stack, commit 6b38733 (not merged). Pending: license confirmation.
- [2026-10-07] User confirmed MIT; ADR-0009 accepted, Q-51 resolved. User accepted ADR-0006 scope change and kept ADRs 0006-0009 accepted. Merged into next.
- [2026-10-07] Completed