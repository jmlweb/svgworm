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
- [x] SKILL.md in the repo teaches an agent to set up svgworm in a Next.js app
- [ ] Skill listed in at least one public skill registry
- [x] svgworm init can add a short svgworm section to the project AGENTS.md (opt-in, non-interactive flag available)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Criterion 4 met by TSK-015: `svgworm init --agents-md` (non-interactive with --yes) appends a marked, idempotent svgworm section to AGENTS.md (commit b0c6239).
- [2026-10-12] Criterion 2 met: skills/svgworm-nextjs/SKILL.md (Agent Skills frontmatter: name, description) walks an agent through install, init --yes --agents-md, build, Icon usage, basePath, cache headers, CI check, and a fix per diagnostic code. Linked from README and llms.txt.
- [2026-10-12] Criteria 1 (Context7 submission) and 3 (public skill registry listing) need the maintainer: both publish to external services and Context7 indexes a public repo URL, best done once v0.1.0 is on npm. Task stays active for those two.
- [2026-10-12] docs/outreach/agent-registries.md: Context7 add-library steps (with an optional context7.json), skill registry options and the one-line listing text, and the verification query for criterion 1. Maintainer submits once v0.1.0 is on npm.