---
id: TSK-079
title: Reproducible client-JS comparison: svgworm vs an icon library and SVGR
status: pending
priority: P3
tags: [site, docs, comparison, adoption]
created: 2026-10-15
source: manual
depends-on: []
---

# Reproducible client-JS comparison: svgworm vs an icon library and SVGR

## Description

The landing-page design critique (2026-10-15) asks "why this instead of my current approach?" Answer it with numbers, not claims.

Render the same icon set three ways in a minimal Next.js app (svgworm, `lucide-react`, SVGR) and measure the client JS and the requests. Publish the method and the results in `/docs/comparison/` (`apps/site/src/content/docs/comparison`), with a short summary near the top of the landing page.

Adding `lucide-react` and SVGR to the spike or measurement app is implied by this task. They are not product dependencies.

## Acceptance Criteria

- [ ] A script under spikes/ or scripts/ reproduces the measurement with one command
- [ ] The comparison doc gets a table with the version of each tool
- [ ] The landing page shows a 1-2 line summary linking to the method
- [ ] The limits are stated honestly, such as the extra build step and 0.x maturity

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created