# 0019. No sprite preload: no adapter helper, no recommendation

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-039
- **Resolves:** Q-23

## Context

The default delivery is an external sprite referenced by `<svg><use href="…/icons.<hash>.svg#id">` ([ADR-0001](0001-external-sprite-default.md), [ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md)). Icons that need `url(#…)` come from the stack file, as `<img>` or as a CSS `mask`. The 2026-10-15 perf audit flagged that a `<use>` sprite is invisible to the preload scanner, so on a cold load icons might paint after text. [ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md) also noted 2-3 cold requests for the stack file and kept Q-23 deferred. The manifest already carries the URLs a hint would need.

Three outcomes were on the table: a docs recommendation (`<link rel="preload">` snippet), an adapter helper that emits the `<link>` from the manifest, or nothing. A wrong hint is worse than none. It can download the file twice, so the decision needs measurement, not a doc line.

## Options considered

1. **Docs recommendation: preload the sprite (and the stack) in `<head>`.**
   - Pros: Firefox starts the sprite fetch at 16 ms instead of 822 ms.
   - Cons: on a slow network, WebKit downloads the sprite twice. Every engine downloads it twice when the response isn't cacheable. Chromium and WebKit gain only the time until the first icon is parsed.
   - Rejected.
2. **Adapter helper (`<SpritePreload />` or `ReactDOM.preload()` from the manifest URLs).**
   - Inherits every cost of option 1.
   - A component rendered in the tree can only emit an inline hint, unless React hoists it. Inline hints gain nothing in Chromium and double-download the sprite in WebKit.
   - `ReactDOM.preload()` would add `react-dom` as a peer of `@svgworm/react`, which today has `react` only (ADR-0008).
   - Rejected.
3. **Stack-only recommendation: `as="image"` in `<head>`.**
   - Pros: safe in all three engines with a long cache, and it removes WebKit's second stack download on a slow network.
   - Cons: an extra download in Chromium and Firefox when the response isn't cacheable. The stack is small (4 KB in the fixtures). Its `<img>` is already found by the preload scanner, and React 19 already emits the equivalent hint for `<img>` icons.
   - Not worth a recommendation. Rejected.
4. **Nothing, plus a docs warning not to preload the sprite.** Chosen.

## Decision

- svgworm ships **no preload helper**. Neither `@svgworm/react` nor the generated `Icon.astro` emits `<link rel="preload">`.
- The docs carry **no preload snippet**. They will state that the sprite should not be preloaded, and why (TSK-040). AI agents and performance guides add preloads by habit.
- React 19's own `<link rel="preload" as="image">` for `<img>` icons stays as is. It is the `as="image"` fragment form, which the matrix shows is reused in all three engines with a long cache.
- The long-cache header recipe stays the main web-performance advice for the sprite and the stack.
- **The decision does not depend on WebKit's in-flight double download**, which has been measured in Playwright WebKit 26 but not in real Safari. If Safari turned out to join the in-flight request, the decision would stand:
  - Chromium and WebKit fetch the sprite at parse time anyway, so a `<head>` hint wins only the time until the first icon is parsed.
  - Inline hints gain nothing in Chromium.
  - Without a long cache, every engine downloads the sprite twice.

## Evidence

[TSK-039 spike](../../spikes/TSK-039-sprite-preload/RESULTS.md): a Playwright 1.58.2 matrix with Chromium 145, Firefox 146 and WebKit 26 (JS disabled, same origin, a fresh browser and persistent profile per load). It crosses 7 hint variants (`as="image"` ± `type`, ± `crossorigin`, ± `#fragment`; `as="fetch"` ± `crossorigin`), 2 positions (`<head>`, inline), and 3 scenarios (`no-store`, `immutable`, `immutable` with assets 600 ms late). The real fixture sprite is 87 KB. Each cell ran 5 times, and fetch counts were identical across runs. [Full matrix](../../spikes/TSK-039-sprite-preload/results/matrix.md).

- **The `<use>` fetch is `Sec-Fetch-Mode: same-origin` in all three engines.** No `<link rel="preload">` can have that mode: `as="image"` is `no-cors`, while `crossorigin` and `as="fetch"` are `cors`. Reuse goes through the HTTP cache or an in-flight join, never the preload cache. Chromium warns "preloaded but not used" even when it reuses.
- **Sprite network fetches with a `<head>` preload**, baseline 1:
  - `no-store`: 2 in every engine.
  - `immutable` with the preload done before the `<use>`: 1 everywhere.
  - `immutable` with the preload in flight: 1 in Chromium and Firefox, **2 in WebKit**.
- **Inline hints** with `immutable`: no gain in Chromium; in Firefox, a gain with `as="fetch"` only; **2 fetches in WebKit** for every variant.
- **Without a hint**, Chromium and WebKit start the `<use>` fetch at parse (302 ms), not after render-blocking CSS. Firefox waits for layout (822 ms). The preload-scanner gap is real only in Firefox.
- **ADR-0010's 2-3 stack requests were mostly cache hits.** With `immutable` there is 1 network fetch in every engine. WebKit fetches twice only when the `mask` asks while the `<img>` fetch is still in flight. An `as="image"` preload then makes it 1.

## Consequences

- No new API, no output-contract change, and no new peer for `@svgworm/react`.
- **TSK-040 (performance notes) carries the warning.** It goes on the site's performance notes, and as one line in both agent skills (`skills/svgworm-nextjs`, `skills/svgworm-astro`): "don't add `<link rel="preload">` for the sprite". It ships with the matrix numbers and a link here. `llms.txt` points to the site docs.
- Revisit if an engine starts reusing preloads for `same-origin` `<use>` fetches (a check in real Safari is still owed), or if an inline delivery (Q-25) makes the question moot.
- Not measured: pages with only `mask` icons, Next.js's default `max-age=0` for `public/`, and real latency with HTTP/2 or HTTP/3.
