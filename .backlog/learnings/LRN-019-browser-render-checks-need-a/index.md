---
id: LRN-019
title: Browser render checks need a negative control; WebKit collapses a broken alt-less img
status: active
tags: [testing, browser-check, playwright, webkit]
task: TSK-004
created: 2026-10-08
---

## Context
The TSK-004 spike checked "the icon rendered" by counting painted pixels in Playwright element screenshots, on a white background with JS disabled.

## Insight
- A render check that only asserts "painted > X%" is untested until a known-broken case fails it. A stale-hash `<use>` paints 0%, but a broken `<img>` paints a broken-image glyph: 1.4% in Chromium and 4.0% in Firefox. The pass threshold has to sit clearly above that (the spike used > 10%; the thinnest icon paints 12.5%).
- In WebKit a broken `<img alt="">` collapses to nothing, so `locator.screenshot()` times out ("element is not visible"). Screenshot fixed page clips for negative controls instead.
- Mono color check on white: red at partial coverage is (255, 255(1-a), 255(1-a)). Test `r > 200 && |g - b| small`, not `g, b < 60`. Otherwise antialiased edges count as "not red", and a correct icon fails the 99% rule.
- The stack file is requested once per consumer type on a cold load: 2 responses in Chromium and WebKit (`<img>` + CSS mask), 3 in Firefox.

## Application
Every browser check in TSK-016 and later product tests should include a stale-URL negative control, and assert thresholds against it. Count requests per file when measuring stack cost (ADR-0006 open item).
