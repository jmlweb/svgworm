---
id: TSK-040
title: Docs: performance notes (savings stat, large icon sets, cold stack fetches)
status: complete
priority: P3
tags: [docs, performance, cli]
created: 2026-10-14
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: performance notes (savings stat, large icon sets, cold stack fetches)

## Description

### Why

Findings from the 2026-10-15 web-performance audit that need only docs, not product changes:

- The CLI "savings" stat is `sourceBytes - spriteBytes - stackBytes` (`packages/svgworm/src/core/compile.ts`), before gzip/brotli. Honest as an optimizer figure, but readers may take it as transfer savings. `cli.md` should say what it is.
- One sprite holds the whole set (Q-22 deferred). Every page downloads all icons on first load. Fine at 10 KiB, dominant at 1,000 icons, and the docs say nothing about when that bites.
- ADR-0010 notes the stack is fetched 2-3 times on a cold load (`<img>` and CSS mask are separate consumers). Users are not told.
- `nextjs.md` cache recipe lacks the `X-Content-Type-Options: nosniff` header that the example and the site set. Consistency.

### What

Short notes in the site docs (`apps/site/src/content/docs/`), mirrored where the same claim lives (`llms.txt`, `skills/svgworm-nextjs/SKILL.md`, `skills/svgworm-astro/SKILL.md`). No product change, so no changeset. If the preload spike (Q-23) lands first, fold its recommendation into the same section.

## Acceptance Criteria

- [x] apps/site/src/content/docs/cli.md says the savings stat is source bytes minus output bytes before compression, an optimizer figure and not transfer savings — evidence: cli.md Output: savings is source bytes minus sprite and stack bytes before gzip/Brotli, an optimizer figure, not transfer savings (2026-10-15)
- [x] The Next.js and Astro setup docs have a short note that every page loads the whole sprite on first visit, that it is fine at tens of KiB, and what to do for large sets (link to Q-22 / TSK-021 until it is decided) — evidence: nextjs.md and astro.md Performance notes: one sprite per page, fine at tens of KiB (site sprite 10.7 KiB for 21 icons), link to open question Q-22 (2026-10-15)
- [x] The docs mention that, with the immutable header, the stack file is one network fetch per cold load in every engine. WebKit fetches it twice only when a `mask` icon asks while the `<img>` fetch is still in flight. ADR-0010's 2-3 requests were mostly cache hits (ADR-0019, TSK-039 matrix) — evidence: same sections: stack is one fetch per cold load with immutable; WebKit twice only when mask asks mid-flight; ADR-0010 requests were cache hits (ADR-0019, TSK-039 matrix linked) (2026-10-15)
- [x] The performance notes, and one line in each agent skill (skills/svgworm-nextjs, skills/svgworm-astro), say not to add `<link rel="preload">` for the sprite: Playwright WebKit 26 downloads it twice when the preload is still in flight (real Safari not checked), and every engine does without a long cache. Cite ADR-0019 and the TSK-039 matrix — evidence: same sections plus one line in skills/svgworm-nextjs and skills/svgworm-astro: do not preload, WebKit 26 double download, real Safari unchecked; ADR-0019 and the matrix cited (2026-10-15)
- [x] apps/site/src/content/docs/nextjs.md cache recipe sets X-Content-Type-Options: nosniff like examples/next-app-router/next.config.ts and apps/site/public/_headers — evidence: nextjs.md cache recipe now sets X-Content-Type-Options: nosniff like next.config.ts and _headers (2026-10-15)
- [x] llms.txt and skills/*/SKILL.md stay in sync with the docs changes (no new claim in one place only) — evidence: llms.txt step 6 carries nosniff and the no-preload note with a link to the site section; skills updated in the same commit (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-14] Created
- [2026-10-15] Criteria updated from TSK-039 / ADR-0019: corrected the stack cold-fetch criterion (with the immutable header the stack is 1 network fetch in every engine), and added the 'don't preload the sprite' docs and agent-skill line
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset. pnpm site:check passed.
- [2026-10-15] Completed