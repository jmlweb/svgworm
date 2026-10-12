---
id: TSK-031
title: Agent discoverability: Context7, agent skill, AGENTS.md snippet
status: active
priority: P2
tags: [traction, agents, discovery]
created: 2026-10-07
source: manual
depends-on: [TSK-017, TSK-015]
started: 2026-10-12
---

# Agent discoverability: Context7, agent skill, AGENTS.md snippet

## Description

Agent track items 2-3 of docs/traction.md. Complements llms.txt and JSON Schema from TSK-017. No MCP server (see the plan for why).


## Acceptance Criteria

- [ ] Docs submitted to Context7 and a query returns current svgworm usage
- [ ] SKILL.md in the repo teaches an agent to set up svgworm in a Next.js app
- [ ] Skill listed in at least one public skill registry
- [x] svgworm init can add a short svgworm section to the project AGENTS.md (opt-in, non-interactive flag available)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Criterion 4 met by TSK-015: `svgworm init --agents-md` (non-interactive with --yes) appends a marked, idempotent svgworm section to AGENTS.md (commit b0c6239).