---
id: LRN-039
title: Preload can't match a <use> fetch, and Playwright WebKit/Firefox contexts fake cold-cache results
status: active
tags: [browser, sprite, delivery, performance, playwright, testing, webkit]
task: TSK-039
created: 2026-10-15
---

## Insight

- **External `<use>` fetches use `Sec-Fetch-Mode: same-origin`** in Chromium, Firefox and WebKit. No `<link rel="preload">` produces that mode: `as="image"` gives `no-cors`, while `crossorigin` or `as="fetch"` give `cors`. So a sprite preload never matches through the preload cache. It can only help through the HTTP cache, or when the engine joins the in-flight request.
  - Chromium and Firefox join an in-flight preload.
  - WebKit waits for it to finish, then downloads the sprite again (Playwright WebKit 26; real Safari not checked).
  - Without a long-lived cache header, every engine downloads it twice.
  - Chromium warns "preloaded but not used" even when it reused the preload through the cache.
- **Chromium and WebKit start the `<use>` fetch when the parser inserts the element**, not at layout. Only Firefox waits for render-blocking CSS.

## Measuring cold loads with Playwright

- **Use a fresh browser and a fresh persistent profile per load** (`launchPersistentContext(mkdtemp())`).
  - A new context in a shared Firefox browser reuses the in-memory image cache across contexts. Later "cold" loads come out warm.
  - Playwright's WebKit has no HTTP cache in an ephemeral context. Even `immutable` files are refetched, which fakes double downloads.
- **Count network fetches on the server, not with Playwright `request` events.** Those also fire for cache hits. ADR-0010's "2-3 cold stack fetches" were Playwright events. On the server it is 1 fetch with `immutable` in every engine.
- **Test in-flight behavior separately.** On localhost the preload finishes in a few ms, which hides in-flight double downloads. Delay asset responses on the server.

Evidence: spikes/TSK-039-sprite-preload/RESULTS.md, docs/adr/0019-sprite-preload-not-recommended.md
