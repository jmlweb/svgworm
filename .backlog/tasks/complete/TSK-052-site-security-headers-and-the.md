---
id: TSK-052
title: Site security headers and the CSS inlining decision
status: complete
priority: P4
tags: [site, security, performance]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site security headers and the CSS inlining decision

## Description

From the 2026-10-15 site review. The site sends no HSTS, Referrer-Policy or CSP. It is static, so the risk is low, and the fix is a few lines in `apps/site/public/_headers`. Separately, about 25 KB of CSS is inlined into every HTML page served with `max-age=0`, so every docs navigation downloads it again. That is a fair trade for a one-page visit but less so for docs browsing; decide and record it.

## Acceptance Criteria

- [x] public/_headers sets Strict-Transport-Security, Referrer-Policy and a CSP that allows the page as built — evidence: public/_headers /* block: Strict-Transport-Security max-age=31536000 includeSubDomains, Referrer-Policy strict-origin-when-cross-origin, X-Content-Type-Options nosniff, CSP default-src self, script-src self plus the SHA-256 of the two inline scripts (scripts/csp-headers.mjs fills them after astro build; check-output.mjs fails when the placeholder is left) (2026-10-15)
- [x] The CSP is checked against the homepage and docs pages with no console violations — evidence: Playwright serving dist with the _headers rules applied: /, /docs/, /docs/nextjs/, /docs/cli/, /docs/icon/ in Chromium, Firefox and WebKit: no console error, no CSP report, icons drawn through <use>, fonts loaded, the pause button and the copy buttons work (2026-10-15)
- [x] The decision to keep about 25 KB of CSS inlined per page, or move it to a hashed external file, is recorded with its reasoning — evidence: Decision: the ~25 KB stylesheet is now a hashed external file (inlineStylesheets auto) served immutable under /_astro/*; recorded in astro.config.ts. index.html went from 58.7 KB to 33.1 KB and docs pages from 63.5 KB to 38.7 KB; first visit pays one same-origin request, every later page saves 25 KB (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] upgrade-insecure-requests was dropped from the policy: HSTS already pins HTTPS, and the directive broke every http://localhost check (WebKit TLS errors).
- [2026-10-15] Completed