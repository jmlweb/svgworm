---
id: TSK-072
title: Docs: heading anchor links
status: pending
priority: P4
tags: [site, docs, ux]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: heading anchor links

## Description

From the 2026-10-15 docs design critique. Docs headings have ids but no visible link, so sharing a deep link means using the sidebar. Astro's heading ids may be added after user rehype plugins run; check the order before choosing an approach.

## Acceptance Criteria

- [ ] Each h2 and h3 shows a # link on hover and focus
- [ ] The link has an accessible name
- [ ] Heading ids do not change
- [ ] No new dependency unless the maintainer approves one (try a local rehype plugin first)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created