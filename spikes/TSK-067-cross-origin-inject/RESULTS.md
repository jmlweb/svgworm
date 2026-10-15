# TSK-067 spike: cross-origin (CDN) sprites through a fetch-and-inject loader

Question (Q-02, PLN-003): can a sprite served from another origin be fetched with CORS + SRI, parsed inertly and injected, so `<use href="#id">` renders it, in Chromium, Firefox and WebKit? And what breaks around it?

## Method

`src/check.mjs` compiles every valid fixture with the built core (`pnpm build` at the root first) and serves two origins: the page on `http://127.0.0.1:<a>` and a "CDN" on `http://localhost:<b>`, with and without `Access-Control-Allow-Origin: *`. Every response on both servers waits 120 ms (`LATENCY`), so request chains show up in the timings. `src/loader.mjs` is the candidate loader: the sprite URL and its sha384 are baked in; it fetches with `mode: "cors"` and `integrity`, parses with `DOMParser` (`image/svg+xml`), drops `<script>`, `<foreignObject>`, `on*` attributes and `javascript:` values, and prepends the `<svg>` (0×0, `aria-hidden`) to `<body>` once, guarded by a `data-svgworm` attribute. Icons are compared pixel by pixel (Δ > 64 on any channel, browser-decoded screenshots) against the same icons through a same-origin external `<use>`. React 19.3 cases server-render a document with `react-dom/server` and hydrate it with `hydrateRoot(document, …)` from an esbuild bundle.

Run: `pnpm install --ignore-workspace && pnpm check`. `PRODUCT=1 pnpm check` runs the same matrix against the loader the built core emits (`packages/svgworm/dist/core/emit/loader.js`); the committed matrix is from that run. Playwright 1.58.2, esbuild 0.28.2, React 19.3.0.

## Results (2026-10-15): 60 of 60 cases pass in all three engines

Full matrix: [results/matrix.md](results/matrix.md).

- **Inject works.** `<use href="#id">` against the injected sprite matches same-origin external `<use>` with 0.00% differing pixels, mono and multicolor, in Chromium, Firefox and WebKit. CLS 0 (Chromium's layout-shift API; the icon box is reserved by `width`/`height`).
- **Time to icons.** With 120 ms per response, the sprite is available 127 ms (Chromium), 137 ms (Firefox) and 146 ms (WebKit) later than the same-origin sprite: one extra round trip, the loader script before the sprite. Icons are blank until then, and without JS they stay blank.
- **SRI mismatch** (a tampered sprite): the fetch rejects, nothing is injected, the loader logs `svgworm: sprite not loaded from <url>: …`.
- **CDN without CORS:** the fetch fails, nothing is injected, same console error.
- **A compromised CDN that swaps the loader:** blocked only when the page pins the loader with `<script src integrity crossorigin="anonymous">`; all three engines refuse to run it ("Failed integrity metadata check"). SRI on the sprite alone does not help, because the sprite's hash lives in the loader on the same CDN. So the manifest needs the loader's sha384 too, and adapters must emit it.
- **Hostile sprite with a valid hash** (`<script>`, `onload`, `onclick`, `javascript:` link): nothing runs; the parse is inert and the sanitizer strips them.
- **Security review payloads** (added after the review of the product loader): `java&#9;script:` and `&#10;javascript:` links, an XHTML-namespace `<iframe srcdoc>` and `<base>`, a page-wide `<style>`, an external `<image>`, `<set attributeName="href" to="javascript:…">`, an external `url()` in a style. The hardened product loader keeps only SVG-namespace elements, drops `script`, `foreignObject`, `style`, `a` and SMIL that targets a link or a handler, and removes `on*`, `src`/`srcdoc`/`data`/`action`/`formaction`/`poster`, script schemes (after removing whitespace and control characters), external `href` (only `#…`, or a raster `data:image` on `<image>`) and external `url()`. Nothing runs, `document.baseURI` and the page stay untouched. A root in the XHTML namespace is rejected. The core's validation is the primary control (it refuses all of these at build time); the loader is the second line.
- **Stack icons cross-origin:** `<img src="cdn/stack.svg#id">` renders with and without CORS. A CSS `mask` from the CDN renders only with CORS (mask images are fetched in CORS mode); without it the icon is blank.
- **CSP:** works with `script-src` and `connect-src` listing the CDN origin (plus `img-src` for stack icons); without `connect-src` the fetch is blocked, nothing is injected, and the browser logs the violation.
- **Duplicate loader tags** and a tag re-added by client navigation inject once.
- **Page id equal to a symbol id:** the sprite is prepended to `<body>`, so `getElementById` finds the symbol first and the icon renders. An element with that id in `<head>` or before `<body>` would still win; symbol ids all start with `i-`, which the docs should call out.
- **Body swap** (Astro ClientRouter replaces `<body>`): the first loader version lost the sprite and every icon went blank. A `MutationObserver` on `<html>` that puts the same node back fixes it in all three engines.
- **React 19 hydration** keeps the injected sprite and logs no hydration error, both when the sprite lands before `hydrateRoot` and when it lands after (slow loader). A state update after hydration keeps it too.
- **Loader size:** 1,226 B unminified with a real URL and hash, no dependencies (PLN-003 hoped for about 500 B; the sanitizer and the body-swap guard are most of the rest).

## Not covered

Real Safari and iOS (Playwright WebKit is not Safari); a real CDN and HTTP/2 multiplexing; Next.js client navigation (the RSC payload does not touch `<body>` children it did not render, which the React case suggests but does not prove).

Decisions: [ADR-0027](../../docs/adr/0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md), loader security model in [ADR-0028](../../docs/adr/0028-inject-loader-keeps-only-svg-content.md).
