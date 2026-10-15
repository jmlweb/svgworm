# 0027. Opt-in cross-origin sprites through an injecting loader

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-067 (plan PLN-003)
- **Resolves:** Q-02; qualifies principle 1 in AGENTS.md; extends the output contract ([ADR-0012](0012-output-contract-v0.1.md)) with a version 2 manifest for this mode only

## Context

Browsers block a cross-origin `<use>`, even with CORS headers ([ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md)), so `publicPath` must be a same-origin path and an `https:` value exits 2 ([ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md)). Next's `assetPrefix` and Astro's `build.assetsPrefix` leave `public/` on the page's origin, so those apps are fine (LRN-018). A Vite app with an absolute `base`, or any deployment that serves static files from a CDN on another origin, cannot use svgworm today. Q-02 listed three ways out: a same-origin proxy, an inline sprite, and fetch-and-inject. The inline sprite was rejected by [ADR-0024](0024-no-inline-sprite-output.md). PLN-003 proposed fetch-and-inject as an explicit opt-in, gated on a browser spike.

## Options considered

1. **Document the same-origin proxy only** (a rewrite from `/icons/*` to the CDN). Zero JS, no contract change. It stays the recommended path, but not every host can proxy, and it gives up the CDN's edge for the sprite.
2. **Inline the sprite.** Rejected by ADR-0024 (twice the sprite on every HTML response in the App Router).
3. **Opt-in fetch-and-inject.** A tiny loader fetches the sprite from the CDN with CORS and SRI, parses it inertly and injects it once; `use` icons then reference `#id` in the same document. Costs one script and one round trip, and icons are blank without JS.

## Decision

Option 3, opt-in only, with option 1 documented first as the zero-JS alternative.

**Config and CLI.** A new key `crossOrigin`, `"none"` (default) or `"inject"`, and a build flag `--cross-origin inject`. With `"inject"`, `publicPath` may be an absolute `https:` URL (origin plus the same path rules as today: no query, fragment, `%`, whitespace, empty, `.` or `..` segments; a trailing `/` is dropped). `http:` and protocol-relative values still exit 2, and an `https:` `publicPath` without `crossOrigin: "inject"` still exits 2 with a message that names the key. `"inject"` with a same-origin path is valid (it is how a CDN deploy is tested locally). `init` asks "Serve sprites from a CDN on another origin?" (default no) and takes `--cdn-url <https-url>`; it never defaults to inject.

**Output (inject mode only).**
- `outDir` gets a third hashed file, `icons.loader.<hash>.js`: the loader with the sprite URL and the sprite's sha384 baked in, LF, no dependencies. Its hash is the same 8-hex SHA-256 rule. It is written with the sprite, before the module. It is not emitted when no icon has `delivery: use`.
- The owned-file pattern of R-15 gains exactly `^icons\.loader\.[0-9a-f]{8}\.js$`.
- The manifest is `version: 2`, adds `"crossOrigin": "inject"`, adds `integrity` (`sha384-<base64>`) to `sprites.<group>.sprite`, and adds `sprites.<group>.loader`: `{ file, url, integrity }` or `null`. Stack entries are unchanged: `img` stack icons load cross-origin natively, `mask` icons need CORS on the CDN (the spike confirmed both).
- `icons.d.ts` in inject mode types `version: 2` and the new fields. **In default mode every byte stays as it is**, `version: 1` included, so nobody who does not opt in sees a change. A version 1 adapter meeting a version 2 manifest fails loudly, which is the contract's rule for unknown versions.

**Adapters.** In inject mode `use` icons render `<use href="#id">`. `@svgworm/react` gains `createSpriteLoader(manifest)`, a Server-Component-safe component (no hooks, no context) that renders `<script async src integrity crossOrigin="anonymous">` for the loader in inject mode and nothing in default mode; it goes in the root layout. `svgworm init` writes the same for Astro as a `SvgwormLoader.astro` next to `Icon.astro` when inject mode is chosen; the `Icon.astro` template handles both versions. Plain HTML reads the same fields from `manifest.json`.

**Loader security model.** The page pins the loader with `integrity` and `crossorigin="anonymous"` (from the manifest), the loader pins the sprite with `integrity`, the sprite is parsed with `DOMParser` as `image/svg+xml` (inert), `<script>`, `<foreignObject>`, `on*` attributes and `javascript:` values are removed, and the sprite is injected once (guarded by its hash) at the start of `<body>`, hidden and `aria-hidden`. A `MutationObserver` on `<html>` puts the same node back when a router swaps `<body>`. Failures inject nothing and log `svgworm: sprite not loaded from <url>: <reason>`. Pages with a CSP need the CDN origin in `script-src` and `connect-src` (and `img-src` for stack icons).

**Principle 1** becomes: zero client JS by default; `crossOrigin: "inject"` is the one opt-in exception, for sprites on another origin, and needs the loader script.

## Evidence

Spike [`spikes/TSK-067-cross-origin-inject`](../../spikes/TSK-067-cross-origin-inject/RESULTS.md), 54 of 54 cases passing in Chromium, Firefox and WebKit (Playwright 1.58.2), on the fixture set compiled by the built core, page and CDN on two origins, 120 ms per response:

- injected `use` icons match same-origin external `use` (0.00% pixels differ), CLS 0;
- SRI mismatch, CDN without CORS and CSP without `connect-src` inject nothing and log an error;
- a swapped loader does not run when the page pins it with `integrity`, which is why the loader hash is in the manifest; a hostile sprite with a valid hash runs nothing;
- `img` stack icons work cross-origin with or without CORS, `mask` only with CORS;
- duplicate and re-added loader tags inject once; a page element sharing a symbol id loses to the prepended sprite;
- a `<body>` swap re-injects; React 19 hydration keeps the sprite in both orders;
- cost: one extra round trip (127 to 146 ms at 120 ms latency) before `use` icons paint, and a 1,226-byte loader.

## Consequences

- Breaking only for opted-in builds: a version 2 manifest needs `@svgworm/react` with this change, and an `Icon.astro` generated before it must be regenerated (`svgworm init`) or updated by hand. Shipped as minor bumps of `svgworm` and `@svgworm/react` with a "Breaking" note ([ADR-0009](0009-license-versioning-and-release.md)).
- Icons in inject mode are blank without JS and paint one round trip later than a same-origin sprite. The docs lead with the same-origin proxy and say this plainly.
- Users own the CDN side: CORS headers, an immutable cache, uploading `outDir`, and keeping old files across deploys ([ADR-0022](0022-builds-keep-only-the-current-sprite.md)).
- Not checked: real Safari and iOS, a real CDN, Next.js client navigation. The release checklist's manual Safari pass covers inject mode too.
