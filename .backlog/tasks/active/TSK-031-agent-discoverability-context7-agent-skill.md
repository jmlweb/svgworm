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

- [x] Docs submitted to Context7 and a query returns current svgworm usage — evidence: context7 query-docs /jmlweb/svgworm "set up svgworm in a Next.js app" (2026-10-14) → returns svgworm init --yes, createIcon(manifest), svgworm check (2026-10-14)
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
- [2026-10-12] docs/outreach/agent-registries.md: Context7 add-library steps (with an optional context7.json), skill registry options and the one-line listing text, and the verification query for criterion 1. Maintainer submits once v0.1.0 is on npm.- [2026-10-13] Unblocked: svgworm@0.1.0 and @svgworm/react@0.1.0 are on npm (TSK-018 complete). The npm-dependent criteria can start.
- [2026-10-14] context7.json committed at repo root (scope: user docs, skill, Next example, package READMEs; 5 agent rules). Context7 resolve-library-id svgworm still finds nothing: not submitted yet.
- [2026-10-14] Registries checked: skills.sh lists a skill after its first `npx skills add` install (`npx skills add jmlweb/svgworm --list` finds svgworm-nextjs; `skills find svgworm` empty). VoltAgent rejects brand-new skills, JackyST0 needs 64 stars, heilcheng stale since 2026-04.
- [2026-10-14] Install command added to README "For AI agents" and llms.txt; docs/outreach/agent-registries.md updated. Remaining: maintainer submits Context7 and runs one skills.sh install.
- [2026-10-14] Maintainer submitted the repo to Context7 and ran one skills.sh install. Context7 serves /jmlweb/svgworm by ID: query-docs returns svgworm init, createIcon(manifest) and svgworm check (criterion 1). resolve-library-id "svgworm" does not find it yet (search lag).
- [2026-10-14] Context7 indexed docs/adr and docs/outreach despite context7.json excludeFolders; recheck after the next refresh, or claim the library to edit settings.
- [2026-10-14] skills.sh: `npx skills find svgworm` and https://skills.sh/api/search?q=svgworm still return 0 (Algolia index lag); criterion 3 stays open until it lists jmlweb/svgworm@svgworm-nextjs.
