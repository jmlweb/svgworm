---
id: TSK-091
title: @svgworm/vite plugin: rebuild the sprite during vite dev
status: active
priority: P3
tags: [vite, adapter, dx, competitors, adr]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-16
---

# @svgworm/vite plugin: rebuild the sprite during vite dev

## Description

Competitor gap: neodx (unplugin), vite-plugin-icons-spritesheet and vite-plugin-svg-spritemap rebuild icons inside `vite dev`. svgworm's Vite path (`examples/vite-react`) runs `svgworm` once in `predev`, so a changed icon needs a second `svgworm watch` process. That is a migration blocker for Vite users.

Approach: a thin `@svgworm/vite` package with no runtime dependencies. `vite` and `svgworm` are peers. It calls `build` and `watch` from `packages/svgworm/src/core/api.ts`. The core stays unaware of Vite (principle 3). It is optional sugar: the CLI stays the documented path and keeps working under Turbopack, webpack and Vite.

Do after RPT-007 (first-run friction), which matters more for adoption. Needs an ADR first (new package, release surface).

## Acceptance Criteria

- [ ] ADR accepted for the Vite plugin (scope changed 2026-10-16 by the maintainer: a `svgworm/vite` subpath export with `vite` as an optional peer, not a new @svgworm/vite package) or rejected with evidence, with the trade-off against the no-bundler-plugin positioning stated — evidence: docs/adr/0033-optional-vite-plugin-as-a-svgworm-vite-subpath.md written as proposed; awaiting maintainer acceptance
- [x] Plugin runs build() on buildStart and watch() during vite dev through the public svgworm API; an SVG change updates the sprite and generated types without restarting vite — evidence: packages/svgworm/src/vite/plugin.ts; vite dev in examples/vite-react rewrote icons.<hash>.svg, icons.js and icons.d.ts on a new icon and logged an HMR update (2026-10-16)
- [x] Tests cover build, dev rebuild and build failure reporting through the Vite logger (exit and overlay behavior stated) — evidence: packages/svgworm/src/vite/plugin.test.ts (17 tests, real Vite createServer/build); behavior stated in ADR-0033 Decision
- [x] examples/vite-react uses the plugin and pnpm example:vite:check still passes, with and without base — evidence: vite.config.ts uses svgworm(); predev/prebuild removed; check:base builds vite.base.config.ts (base /app/, publicPath /app/icons in svgworm.base.config.json) and passes
- [x] vite.md, llms.txt and the README describe the plugin as optional, with the CLI kept as the main path; changeset added — evidence: vite.md 'Rebuild in vite dev (optional plugin)' and base section, llms.txt, README, comparison.md, vision.md; .changeset/vite-plugin-rebuild-in-dev.md

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-16] Started
- [2026-10-16] Maintainer chose a `svgworm/vite` subpath over a new package (no new npm package or trusted-publisher setup) and Vite `base` derivation when publicPath is unset (partly supersedes ADR-0029's base bullet for the plugin). Added ResolvedConfig.isDefaultPublicPath, src/vite plugin + tests, lint boundaries, example switch, docs, changeset, ADR-0033 (proposed). pnpm verify, example:vite:check, site:check and typecheck:ts7 pass. Remaining: maintainer accepts ADR-0033.
- [2026-10-16] Found and documented: with a fixed base and committed output, plugin-derived URLs make plain `svgworm check` exit 1; guide and ADR-0033 now say to set publicPath in the config in that case.
- [2026-10-16] Maintainer rejected base derivation after the check conflict. The plugin now never rewrites publicPath; with a root-path base and no publicPath it throws a ConfigError (vite dev and vite build stop). Example check:base uses vite.base.config.ts + svgworm.base.config.json. ADR-0033 and docs rewritten; ADR-0029 kept as is. All gates pass.
