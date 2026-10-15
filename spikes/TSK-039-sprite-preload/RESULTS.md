# TSK-039 spike: sprite preload (Q-23)

_Date: 2026-10-15. Throwaway prototype, evidence only. `playwright` is a spike tool here, not a product choice._

## Question

External `<use>` sprites are said to be invisible to the preload scanner. When does the sprite request start without a hint? Does `<link rel="preload">` (`as="image"`, `as="fetch"`, with or without `crossorigin`) get reused by the `<use>`, `<img>` and CSS `mask` fetches, ignored, or downloaded twice? Does a preload collapse the 2-3 cold stack fetches [ADR-0010](../../docs/adr/0010-sprite-url-delivery-generated-module-and-public-path.md) noted?

## Method

```sh
pnpm build                     # at the repo root first: the spike imports the built core
cd spikes/TSK-039-sprite-preload
pnpm install --ignore-workspace
REPS=5 pnpm measure            # writes results/matrix.json and results/matrix.md
```

- **Real output.** Every valid fixture is compiled with the built core (`packages/svgworm/dist`), the same set as `pnpm determinism:fingerprint`. Sprite `icons.9af272b0.svg` is 87,626 bytes (the flag fixture is most of it), stack `icons.stack.d2afff96.svg` is 4,335 bytes.
- **Pages.** `use` (3 `<use>` icons), `stack` (2 `<img>` and 2 `mask` icons), `all` (both). Markup matches what `@svgworm/react` renders.
- **Timing.** A Node server flushes `<head>` (padded past 2 KB) at 0 ms and `<body>` at 300 ms. A render-blocking stylesheet in `<head>` answers at 800 ms, so first layout waits for it. "start" is when the server sees the first request for the file, relative to the page request.
- **Ground truth is the server log**: one line per request that reached the network, with `Sec-Fetch-Dest` and `Sec-Fetch-Mode` (all three engines send them). Playwright's `request` events are recorded next to it; they also count requests served from the HTTP or memory cache.
- **Variants** of `<link rel="preload">` for each file the page uses: `as="image"`, `as="image" type="image/svg+xml"`, `as="image" crossorigin`, `as="fetch"`, `as="fetch" crossorigin`, and `as="image"` with the `#id` fragment (the form React 19 emits for an `<img>`). Each one in two positions: in `<head>`, and inline in `<body>` just before the first icon, where a component would render it.
- **Scenarios.**
  - `no-store`: assets are uncacheable.
  - `immutable`: `public, max-age=31536000, immutable`, as the docs recommend.
  - `immutable-slow`: the same header, but every asset answers 600 ms late. A `<head>` preload is then still in flight when the body arrives, as on a real network. Only `<head>` hints are run in this scenario.
- **Cold loads.** Playwright 1.58.2 with Chromium 145.0.7632.6, Firefox 146.0.1 and WebKit 26.0. JS is disabled, and the page is same-origin over HTTP. Each load gets **its own browser with a fresh persistent profile**. Two shortcuts gave wrong numbers and were dropped:
  - **Shared browser, new context per load.** Firefox reuses its in-memory image cache across contexts. Later "cold" loads were warm: the stack baseline fell from 5 server fetches to 1, and preloads started at about 808 ms.
  - **New browser per load, ephemeral context.** Playwright's WebKit has no HTTP cache in an ephemeral context. A second tab refetched every `immutable` file, and with a persistent profile it didn't. That faked a WebKit double download under `immutable`.
- **Five runs per cell**, median start. Every cell's fetch count was identical across all five runs.
- **Console.** Chromium's preload warnings ("preloaded but not used", "credentials mode does not match") are captured 3.5 s after `load`.

## Results

Full matrix: [`results/matrix.md`](results/matrix.md), raw data in `results/matrix.json`. The **verdict** column compares only the network-fetch count and the start time with the no-hint baseline. It doesn't check which consumer the preload served. For example, `webkit immutable-slow stack fetch head` reads "reused, earlier", but its requests are the preload plus a second `<img>` fetch at about 608 ms. Read the dest/mode column for the details.

### 1. When the request starts with no hint

| | Chromium | Firefox | WebKit |
|---|---|---|---|
| Sprite (`<use>`) | 302 ms, when the parser inserts the `<use>` | 822 ms, after the stylesheet | 302 ms, at parse |
| Stack (`<img>`) | 302 ms | 818 ms | 302 ms |
| Stack (`mask`), when it reaches the network | about 805 ms, after the stylesheet | about 820 ms | about 810 ms |

The premise holds only for Firefox. Chromium and WebKit start the `<use>` fetch as soon as the element is parsed, not at layout, so render-blocking CSS doesn't delay it. In those engines a hint in `<head>` wins only the time between the head and the first icon arriving.

The `<use>` request is `Sec-Fetch-Dest: image`, **`Sec-Fetch-Mode: same-origin`**, in all three engines. No `<link rel="preload">` produces that mode: `as="image"` gives `no-cors`, while `crossorigin` and `as="fetch"` give `cors`. A preload can serve the `<use>` fetch only through the HTTP cache, or by the engine joining the in-flight request. It never matches as a preload-cache hit. Chromium warns "preloaded but not used" for every sprite preload, even when the `<use>` was served from the cache the preload filled.

### 2. Sprite preload (`<use>`)

Network fetches of the 87 KB sprite. The baseline is 1 everywhere.

| Hint in `<head>` (any variant) | Chromium | Firefox | WebKit |
|---|---|---|---|
| `no-store` | **2** | **2** | **2** |
| `immutable`, preload already done when the `<use>` asks | 1, from 302 to 2 ms | 1, from 822 to 16 ms | 1, from 302 to 7 ms |
| `immutable-slow`, preload still in flight | 1 (joins it) | 1 (joins it) | **2**: the `<use>` waits for the preload to finish, then fetches again (about 610 ms) |

Inline hints (`immutable`): Chromium no gain. Firefox no gain, except `as="fetch"`, which starts at 303 ms instead of 822 ms. WebKit: **2 fetches** for every variant.

### 3. Stack preload (`<img>` and `mask`)

ADR-0010's counts were Playwright-observed requests: Chromium and WebKit 2, Firefox 3 (5 here, with two icons of each kind). Most of them were cache hits. The server log separates the network fetches:

| No hint | Chromium | Firefox | WebKit |
|---|---|---|---|
| `no-store` | 2 | 5 (one per element; one is `same-origin`) | 2 |
| `immutable` | 1 | 1 | 1 |
| `immutable-slow` | 1 | 1 | **2**: the `mask` fetch (about 810 ms) doesn't join the `<img>` fetch still in flight |

Network fetches with a hint in `<head>`:

| Hint in `<head>` | Chromium | Firefox | WebKit |
|---|---|---|---|
| `as="image"` (± `type`, ± fragment), `immutable` / `-slow` | 1 / 1 | 1 / 1 | 1 / **1 (2→1)** |
| `as="image"` (± `type`), `no-store` | **3** (+1) | **6** (+1) | 1 (2→1) |
| `as="image" crossorigin` | 1, but Chromium warns "credentials mode does not match" | 1 (`immutable`) | **3** in `immutable-slow` |
| `as="fetch"` (± `crossorigin`), `immutable` | 1 | **2** | 1 (inline: 2) |

The fragment form with `no-store`: Chromium 3, Firefox 5, WebKit 1.

### 4. React 19's automatic `<img>` preload

`renderToStaticMarkup` of an `img` icon from `@svgworm/react` puts `<link rel="preload" as="image" href="…stack.<hash>.svg#id">` before the `<img>` (`packages/react/src/create-icon.test.tsx`). Where that link lands in a streamed Next.js page was not checked. It is the `image-fragment` variant: with a long cache it is reused in all three engines, and it removes WebKit's second stack download on a slow network.

## Verdict

- **Sprite:** don't preload it. On a real network, WebKit (Safari, and every iOS browser) downloads the sprite twice when a `<head>` preload is still in flight. It also does so for every inline hint, and every engine does so when the response isn't cacheable. When the preload works, the gain is real only in Firefox, because Chromium and WebKit already fetch at parse time.
- **Stack:** `as="image"` in `<head>` with a long cache is safe in all three engines, and it removes WebKit's second stack download on a slow network. It costs an extra download in Chromium and Firefox when the response isn't cacheable. The `<img>` is already found by the preload scanner, and React 19 already emits the equivalent hint for `<img>` icons.
- **Inline hints**, which are all a component can emit once the shell has streamed, gain nothing in Chromium. They double-download the sprite in WebKit.

Decision in [ADR-0019](../../docs/adr/0019-sprite-preload-not-recommended.md).

## Limits

- Localhost over HTTP/1.1, with a fixed artificial delay in `immutable-slow`. No real latency, and no HTTP/2 or HTTP/3 prioritization. Start times show order, not real-world gains.
- Playwright's WebKit is not Safari. Check real Safari before quoting the WebKit in-flight double download as Safari behavior.
- JS is disabled, so no script blocks the parser. Firefox fetching the `<img>` only after the stylesheet may be a parser-speculation effect of that setup, not how Firefox behaves on every page.
- A page with only `mask` icons (no `<img>`) was not measured. Its stack fetch waits for layout in every engine.
- Next.js serves `public/` with `max-age=0` unless the docs' header recipe is applied. That case (cacheable but stale) was not measured.
