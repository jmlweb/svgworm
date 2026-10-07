---
id: TSK-014
title: Re-plan backlog for lean v0.1
status: pending
priority: P2
tags: []
created: 2026-10-07
source: plan/PLN-001
depends-on: []
---

# Re-plan backlog for lean v0.1

## Description

## Goal

Publish svgworm v0.1.0 on npm as fast as quality allows, positioned per ADR-0005: icon sprites for Next.js App Router and Server Components, correct with zero config. Then measure adoption against the kill criteria 12 weeks later.

v0.1 is done when a team can run `npx svgworm init` in a Next.js 16 app, drop in SVGs exported from Figma, and get:
- themed mono icons and untouched multicolor icons;
- a typed, Server Component-safe `<Icon>` with zero client JS;
- a CI `check`.

## Context

- **Decided:** ADR-0004 (per-icon color, 99.98% on 31k icons) and ADR-0005 (build, lean v0.1, kill criteria). TSK-001, 003 and 007 are complete. `fixtures/` exists.
- **Evidence we can reuse:**
  - The TSK-007 spike showed a generated TS module plus a plain `<svg><use href>` component works in Next 16 + Turbopack with zero client JS (Q-20 has a known-good shape).
  - The TSK-003 spike showed svgo 4's AST and `inlineStyles` handle our color rewrite. That is input for the stack ADR, not a decision.
- **Problem with the current backlog:** it is design-first. TSK-008 waits on five spikes, and TSK-009 waits on TSK-008, so nothing ships until every question is closed. ADR-0005 says to stop adding spikes except those that can break the default delivery.
- **Pending reports:** none. **Active tasks:** none.

## Approach

### M0: Decisions (timebox about 1 week; tasks run in parallel)

1. **TSK-002 browser spike: keep.** It is the one spike that can break the default delivery (gradients and masks through external `<use>`). Trim the cross-origin part to "document the constraint and recommend same-origin". Also check ADR-0004's mono rewrite in Chromium, Firefox and WebKit, since it was only verified with resvg.
2. **TSK-006 naming: keep, timeboxed.**
   - `/` as the namespace separator;
   - NFC normalization, which fixes the NFD issue seen in neodx;
   - lowercase kebab ids;
   - collisions are an error.
   - The alias map is deferred.
3. **TSK-009 stack ADR: drop the dependency on TSK-008** so it runs in parallel. Also fold in the release tooling (npm provenance, versioning) and the license (Q-51). The spike evidence on svgo goes into the parser and optimizer choice.
4. **TSK-004 delivery spike: turn into a decision task.**
   - Adopt a generated module with URL constants plus a configurable base path, verified only in Next.js 16 and plain HTML.
   - Defer Vite and Astro recipes, preload helpers (Q-23) and the inline form (Q-25) past v0.1.
   - Hash length and naming (Q-24) go into the contract.
5. **TSK-005 TypeScript performance: defer past v0.1.** v0.1 emits a plain string union. Revisit when a user reports more than about 2k icons.
6. **TSK-008 contract: becomes "Output contract v0.1".**
   - It depends only on 002, 004 (decision) and 006.
   - It is a 0.x contract, so breaking changes are allowed with a semver-minor note until 1.0.
   - Scope: one sprite, the manifest (with `color: mono | multicolor`), and types.

### M1: Build

7. **TSK-010 scaffold**, as written, plus CI on Linux, macOS and Windows. The determinism test needs all three.
8. **TSK-011 walking skeleton, trimmed for v0.1.**
   - Keep:
     - reading, NFC naming and collisions;
     - optimizing with per-icon id prefixes;
     - ADR-0004 color, ported from the spike as ideas only (rules decided, code rewritten test-first);
     - the sprite, manifest and types;
     - config validation and cleanup.
   - Add a determinism test for shuffled input and NFC/NFD names.
   - Add a minimal CLI UX (principle 7): progress, an end-of-run stats summary (icons, sizes, mono vs multicolor counts, timing), `--json`, and stable exit codes.
   - Move inline sprite output (R-13) out of v0.1.
9. **TSK-012 React adapter, trimmed.**
   - Drop the inline sprite part.
   - "Multiple sprites" becomes "resolves the sprite URL from the manifest", so it keeps working once multi-sprite lands.
   - Verify zero client JS in the example app.
10. **Split TSK-013.**
    - **v0.1:** `check` mode, plus a simple watch that rebuilds everything on change. With the R-50 budget that is fast enough, and `next dev` needs it.
    - **Later:** incremental watch (a new task).
11. **New task: `svgworm init`.** It is interactive in a TTY and works fully from flags (R-56). It writes the config, adds the `predev`/`prebuild` scripts and creates the Next.js `Icon` wiring. Adoption depends on the first five minutes.

### M2: Launch

12. **New task: `examples/next-app-router`** (Next 16, Turbopack, Server Components), with an automated check that no icon code reaches client chunks. This reuses the TSK-007 method.
13. **New task: docs for discovery (R-55).**
    - README with copy-pasteable quick start, npm keywords, `llms.txt`, and a JSON Schema for the config.
    - An honest comparison page: SVGR, @neodx/svg and vite-plugin-icons-spritesheet, with the spike numbers and with where each tool is the better choice.
14. **New task: release v0.1.0** (npm provenance, changelog, GitHub release). Needs your explicit go before publishing.
15. **New task: launch outreach.**
    - A post built on the 31k-icon color result and the Turbopack comparison.
    - A short list of starters and templates to propose svgworm to.
    - The launch date gets recorded; it starts the 12-week clock.

### M3: Measure

16. **New task: kill-criteria review, launch + 12 weeks** (ADR-0005). A small script:
    - npm downloads, four-week average, from `api.npmjs.org/downloads/range`;
    - distinct external authors of issues and PRs, via `gh`, excluding maintainers;
    - the starter-adoption list, maintained by hand.

    The output is a short report and a continue-or-stop decision as an ADR. Optionally a scheduled cloud routine reminds on the date.

### Explicitly deferred past v0.1, with new pending tasks so nothing is lost

- Multiple sprites (Q-22); inline sprite (R-13, Q-25)
- Incremental watch
- TypeScript performance spike (TSK-005)
- Vite and Astro recipes; alias map (Q-32)
- CSS-variable multicolor mode (Q-12)
- Markers, CSS variables and animations in color classification



## Acceptance Criteria

- [ ] TSK-002 trimmed: cross-origin reduced to documented constraint; mono rewrite checked in Chromium, Firefox, WebKit
- [ ] TSK-004 converted to decision task (Next.js 16 + plain HTML only; Q-23/Q-25 deferred; Q-24 into contract)
- [ ] TSK-005 set to P3 and tagged post-v0.1
- [ ] TSK-006 timeboxed with proposed defaults: / separator, NFC, lowercase kebab, collisions error; alias map deferred
- [ ] TSK-008 retitled Output contract v0.1, depends on TSK-002/004/006, single-sprite scope, 0.x breaking-change policy stated
- [ ] TSK-009 has no dependencies and covers release tooling and license (Q-51)
- [ ] TSK-010 includes CI on Linux, macOS, Windows
- [ ] TSK-011 drops R-13, adds NFC/NFD determinism test and minimal CLI UX (progress, stats, --json, stable exit codes)
- [ ] TSK-012 drops inline sprite, resolves sprite URL from manifest, verifies zero client JS
- [ ] TSK-013 scoped to check + full-rebuild watch; incremental watch split into new task
- [ ] New tasks created: svgworm init, example app, discovery docs + comparison page, release v0.1.0, launch outreach, kill-criteria review
- [ ] One pending task per deferred item: multi-sprite, inline sprite, incremental watch, Vite/Astro recipes, alias map, CSS-variable mode, color edge cases
- [ ] docs/requirements.md marks each R-xx as v0.1 or later
- [ ] docs/open-questions.md marks deferred questions with Deferred to post-v0.1 (ADR-0005)
- [ ] AGENTS.md phase line updated (or scheduled) for the move from design to build once TSK-009 is accepted
- [ ] Open questions resolved: multi-sprite, Vite, v0.1.0 target date, kill-criteria reminder method

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created