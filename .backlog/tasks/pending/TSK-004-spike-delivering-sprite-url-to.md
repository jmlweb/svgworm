---
id: TSK-004
title: Decision: sprite URL delivery without bundler plugin
status: pending
priority: P1
tags: [decision, integration, adr]
created: 2026-10-07
source: manual
depends-on: []
---

# Decision: sprite URL delivery without bundler plugin

## Description

Resolve Q-20, Q-24. Q-21 is limited to Next.js App Router and plain HTML. Q-23 (preload) and Q-25 (inline form) are deferred past v0.1. Decide the generated module with URL constants and a configurable base path, verified only in Next.js 16 and plain HTML (TSK-014).

## Acceptance Criteria

- [x] Works in plain HTML and Next.js 16 App Router
- [x] Vite and Astro recipes deferred to post-v0.1
- [x] ADR written; output-contract.md manifest section updated
- [x] open-questions.md updated
- [x] Learning added

## Notes

## Learnings

- LRN-018: Next.js public/ is the right home for use-href sprites, but basePath and caching are manual
- LRN-019: Browser render checks need a negative control; WebKit collapses a broken alt-less img
## Progress Log

- [2026-10-07] Created
- [2026-10-08] ADR-0010 accepted: generated icons.js + icons.d.ts + manifest.json with URLs built from a configured publicPath (default public/icons -> /icons), files <group>.<sha256:8>.svg and <group>.stack.<sha256:8>.svg. Evidence: spikes/TSK-004-sprite-url, 36/36 checks in plain HTML, Next 16.4 and Next with basePath; Chromium, Firefox, WebKit with JS off. output-contract.md manifest section, open-questions (Q-05, Q-20, Q-24 resolved; Q-21 partly; Q-23, Q-25 deferred), requirements R-11/R-15 and viability updated. Vite/Astro stay in TSK-024. Learnings LRN-018, LRN-019. No product code, so no product tests: the spike check is the evidence.