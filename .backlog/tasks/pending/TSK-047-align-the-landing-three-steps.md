---
id: TSK-047
title: Align the landing three steps with the Next.js docs
status: pending
priority: P2
tags: [site, docs, onboarding]
created: 2026-10-15
source: manual
depends-on: []
---

# Align the landing three steps with the Next.js docs

## Description

From the 2026-10-15 site review. The landing promises "Three steps, no bundler config." built on `svgworm init`. "Get started" links to `/docs/nextjs/`, which says "five steps", starts with `pnpm svgworm --source icons`, and mentions `init` only in a tip. A newcomer lands on a different path than the one just promised. The docs live in `apps/site/src/content/docs/nextjs` (ADR-0018).

## Acceptance Criteria

- [ ] /docs/nextjs/ leads with svgworm init as the main setup path
- [ ] Manual setup (svgworm --source icons, scripts, component) is kept as a fallback section
- [ ] The landing step count and commands match the docs page that Get started links to
- [ ] llms.txt and the svgworm-nextjs skill stay consistent with the new docs order

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created