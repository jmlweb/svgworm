---
id: TSK-069
title: Copy button on docs code blocks
status: pending
priority: P3
tags: [site, docs, ux]
created: 2026-10-15
source: manual
depends-on: []
---

# Copy button on docs code blocks

## Description

From the 2026-10-15 docs design critique. No docs code block has a copy affordance, and the docs are built to be copied from (principle 10). Principle 1 binds the generated output, not the site, so a small inline script is allowed, but only on `/docs/*` pages: the landing page stays at 0 B of JS (see TSK-049).

## Acceptance Criteria

- [ ] Every pre on /docs/* pages has a copy button
- [ ] The button is keyboard-reachable, has an accessible name and announces the copy
- [ ] It works in light and dark themes
- [ ] Without JS the button is hidden
- [ ] The landing page still ships 0 B of JavaScript

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created