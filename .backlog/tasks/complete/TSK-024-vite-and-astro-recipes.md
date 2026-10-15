---
id: TSK-024
title: Vite recipe
status: complete
priority: P4
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Vite recipe

## Description

Deferred past v0.1. Q-21 for Vite (Astro was answered by ADR-0017 in TSK-037). Plain HTML and Next.js are covered in v0.1. Dilutes the Next.js positioning if done early (PLN-001 open question 2).

## Acceptance Criteria

- [x] Recipe drafted and verified for Vite — evidence: pnpm example:vite:check → exit 0 (real vite build, default and base /app/) (2026-10-15)

## Notes

## Learnings

- LRN-045: A new vite version in any workspace package splits vitest's vite peer and untypes vitest configs
## Progress Log

- [2026-10-07] Created
- [2026-10-14] Retitled from "Vite and Astro recipes": Astro is covered by TSK-037 (ADR-0017, generated Icon.astro).
- [2026-10-15] Started
- [2026-10-15] Delegated to a sonnet worktree agent (Phase 2 wave 1): examples/vite-react + docs/vite page.
- [2026-10-15] examples/vite-react (Vite 8.3.3, @vitejs/plugin-react 6.1.2, React 19.3; versions aligned with the workspace so vitest keeps one vite peer) with check:dist and check:base (base /app/); root example:vite:build/check; CI job example-vite; site docs vite.md (order 3, docs index group), troubleshooting/nextjs/astro links, react README; llms.txt, astro skill, README, AGENTS.md, Q-21 resolved. Gates: verify, site:check, example:vite:check, example:check exit 0.
- [2026-10-15] Completed