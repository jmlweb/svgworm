---
id: TSK-047
title: Align the landing three steps with the Next.js docs
status: active
priority: P2
tags: [site, docs, onboarding]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
---

# Align the landing three steps with the Next.js docs

## Description

From the 2026-10-15 site review. The landing promises "Three steps, no bundler config." built on `svgworm init`. "Get started" links to `/docs/nextjs/`, which says "five steps", starts with `pnpm svgworm --source icons`, and mentions `init` only in a tip. A newcomer lands on a different path than the one just promised. The docs live in `apps/site/src/content/docs/nextjs` (ADR-0018).

## Acceptance Criteria

- [x] /docs/nextjs/ leads with svgworm init as the main setup path
- [x] Manual setup (svgworm --source icons, scripts, component) is kept as a fallback section
- [x] The landing step count and commands match the docs page that Get started links to
- [x] llms.txt and the svgworm-nextjs skill stay consistent with the new docs order

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] /docs/nextjs/ now has the landing's three steps (install + `svgworm init`; icons/ + `pnpm svgworm`; render), with "Set up by hand" as the fallback. Landing step 2 now shows `pnpm svgworm`, which is the next step `init` prints. The old manual scripts (`"predev": "svgworm"` with no config) would exit 2 because `sources` is required, so the fallback and llms.txt manual step 5 now pass `--source icons`. llms.txt says to build after init. The svgworm-nextjs skill already went install, init, build, render, so it needed no change. `pnpm site:check` and `pnpm format:check` pass. No tests: docs and copy only, checked by site:check.
