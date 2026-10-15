---
id: TSK-080
title: Site audit: accessibility, mobile layout, Core Web Vitals
status: active
priority: P3
tags: [site, accessibility, performance]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
---

# Site audit: accessibility, mobile layout, Core Web Vitals

## Description

Section 7 of the landing-page design critique (2026-10-15) is a checklist with no findings yet. Turn it into facts.

Run axe and Lighthouse on `/` and on a docs page, and check both at 360px and 768px. Cover keyboard and focus, contrast, heading structure, and terminal and code overflow. File each finding as its own task or report.

TSK-051 (font weight and caching) overlaps on performance but does not block this.

## Acceptance Criteria

- [ ] axe and Lighthouse (mobile and desktop) results for / and /docs/nextjs/ are recorded in the progress log
- [ ] Keyboard-only navigation of the header, install switch, copy buttons and color demo is checked
- [ ] Overflow of the terminal and code blocks at 360px is checked
- [ ] Each finding is filed with /flowstate:report or /flowstate:add-task

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Delegated to a sonnet worktree agent (audit only, findings returned to the main session).