---
id: TSK-052
title: Site security headers and the CSS inlining decision
status: pending
priority: P4
tags: [site, security, performance]
created: 2026-10-15
source: manual
depends-on: []
---

# Site security headers and the CSS inlining decision

## Description

From the 2026-10-15 site review. The site sends no HSTS, Referrer-Policy or CSP. It is static, so the risk is low, and the fix is a few lines in `apps/site/public/_headers`. Separately, about 25 KB of CSS is inlined into every HTML page served with `max-age=0`, so every docs navigation downloads it again. That is a fair trade for a one-page visit but less so for docs browsing; decide and record it.

## Acceptance Criteria

- [ ] public/_headers sets Strict-Transport-Security, Referrer-Policy and a CSP that allows the page as built
- [ ] The CSP is checked against the homepage and docs pages with no console violations
- [ ] The decision to keep about 25 KB of CSS inlined per page, or move it to a hashed external file, is recorded with its reasoning

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created