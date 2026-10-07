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

- [ ] Works in plain HTML and Next.js 16 App Router
- [ ] Vite and Astro recipes deferred to post-v0.1
- [ ] ADR written; output-contract.md manifest section updated
- [ ] open-questions.md updated
- [ ] Learning added

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created