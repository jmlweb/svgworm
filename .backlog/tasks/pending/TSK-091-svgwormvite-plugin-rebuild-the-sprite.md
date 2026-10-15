---
id: TSK-091
title: @svgworm/vite plugin: rebuild the sprite during vite dev
status: pending
priority: P3
tags: [vite, adapter, dx, competitors, adr]
created: 2026-10-15
source: manual
depends-on: []
---

# @svgworm/vite plugin: rebuild the sprite during vite dev

## Description

Competitor gap: neodx (unplugin), vite-plugin-icons-spritesheet and vite-plugin-svg-spritemap rebuild icons inside `vite dev`. svgworm's Vite path (`examples/vite-react`) runs `svgworm` once in `predev`, so a changed icon needs a second `svgworm watch` process. That is a migration blocker for Vite users.

Approach: a thin `@svgworm/vite` package with no runtime dependencies. `vite` and `svgworm` are peers. It calls `build` and `watch` from `packages/svgworm/src/core/api.ts`. The core stays unaware of Vite (principle 3). It is optional sugar: the CLI stays the documented path and keeps working under Turbopack, webpack and Vite.

Do after RPT-007 (first-run friction), which matters more for adoption. Needs an ADR first (new package, release surface).

## Acceptance Criteria

- [ ] ADR accepted for a @svgworm/vite package (zero deps, vite and svgworm as peers) or rejected with evidence, with the trade-off against the no-bundler-plugin positioning stated
- [ ] Plugin runs build() on buildStart and watch() during vite dev through the public svgworm API; an SVG change updates the sprite and generated types without restarting vite
- [ ] Tests cover build, dev rebuild and build failure reporting through the Vite logger (exit and overlay behavior stated)
- [ ] examples/vite-react uses the plugin and pnpm example:vite:check still passes, with and without base
- [ ] vite.md, llms.txt and the README describe the plugin as optional, with the CLI kept as the main path; changeset added

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created