---
id: TSK-079
title: Reproducible client-JS comparison: svgworm vs an icon library and SVGR
status: active
priority: P3
tags: [site, docs, comparison, adoption]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
---

# Reproducible client-JS comparison: svgworm vs an icon library and SVGR

## Description

The landing-page design critique (2026-10-15) asks "why this instead of my current approach?" Answer it with numbers, not claims.

Render the same icon set three ways in a minimal Next.js app (svgworm, `lucide-react`, SVGR) and measure the client JS and the requests. Publish the method and the results in `/docs/comparison/` (`apps/site/src/content/docs/comparison`), with a short summary near the top of the landing page.

Adding `lucide-react` and SVGR to the spike or measurement app is implied by this task. They are not product dependencies.

## Acceptance Criteria

- [x] A script under spikes/ or scripts/ reproduces the measurement with one command — evidence: spikes/TSK-079-client-js-comparison: pnpm measure (2026-10-15)
- [x] The comparison doc gets a table with the version of each tool — evidence: comparison.md Client JS, measured: table with versions (2026-10-15)
- [ ] The landing page shows a 1-2 line summary linking to the method
- [x] The limits are stated honestly, such as the extra build step and 0.x maturity — evidence: limits listed: build step, extra request, 0.x, small gaps, cold cache single run (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Measurement spike delegated to a sonnet worktree agent (spikes/TSK-079-client-js-comparison); doc and landing copy follow in the main session.
- [2026-10-15] Spike committed (spikes/TSK-079-client-js-comparison, pnpm measure: one Next 16.3.8 app, 7 routes, 20 Lucide icons; svgworm/lucide-react 1.50.0/SVGR 8.1.0 under Turbopack). Comparison doc gets 'Client JS, measured' with the table, versions and limits. Landing summary waits for the site wave-2 agent (landing page conflicts).