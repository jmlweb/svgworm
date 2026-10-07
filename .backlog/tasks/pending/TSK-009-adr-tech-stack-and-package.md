---
id: TSK-009
title: ADR: tech stack and package layout
status: pending
priority: P1
tags: [adr, tooling]
created: 2026-10-07
source: manual
depends-on: []
---

# ADR: tech stack and package layout

## Description

Resolve Q-40, Q-41, Q-42, Q-51. Choose runtime target, language, build, test runner, SVG parser/optimizer, CLI framework, config format, monorepo vs subpath exports, license. Evidence-based per .claude/rules/decisions.md.

Runs in parallel with M0 (TSK-014), so it no longer waits on TSK-008. Also covers release tooling (npm provenance, versioning) and the license (Q-51). Svgo evidence from TSK-003 feeds the parser and optimizer choice.

## Acceptance Criteria

- [ ] One ADR per major choice or one consolidated ADR with evidence
- [ ] Dependency budget justified
- [ ] License decided
- [ ] Release tooling chosen (npm provenance, versioning)
- [ ] AGENTS.md phase line updated when this ADR is accepted (design to build)
- [ ] CLI UX stack (progress, prompts, stats) chosen per principle 7 / R-53, with non-TTY fallback
- [ ] Supported version range (runtime, browsers, React) stated per principle 8 / R-54

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created