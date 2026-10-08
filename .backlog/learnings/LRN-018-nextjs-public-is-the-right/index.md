---
id: LRN-018
title: Next.js public/ is the right home for use-href sprites, but basePath and caching are manual
status: active
tags: [nextjs, delivery, caching, same-origin, output-contract]
task: TSK-004
created: 2026-10-08
---

## Context
TSK-004 spike (spikes/TSK-004-sprite-url) served hashed sprite + stack files from Next 16 `public/icons`, with and without `basePath: '/docs'`, checked in 3 engines with JS off.

## Insight
- `assetPrefix` applies only to `/_next/static`, never to `public/`. So `public/` stays same-origin even when the app uses a CDN, which `<use href>` requires (ADR-0006). A bundler-imported sprite (`import url from './x.svg'`) would follow `assetPrefix` to the CDN and break every `<use>`.
- Next does NOT add `basePath` to raw `href`/`src` strings. Under `basePath: '/docs'`, `/icons/x.svg` is a 404, and the URL must be `/docs/icons/x.svg`.
- Next serves `public/` with `Cache-Control: public, max-age=0`. A `headers()` rule (`source: '/icons/:file*'`, `public, max-age=31536000, immutable`) works in `next start`, and its `source` is basePath-relative (no `/docs` prefix needed).

## Application
svgworm writes URLs as `publicPath + '/' + file` at generation time (ADR-0010). Docs, `svgworm init` and the Next example (TSK-016) must tell users that `publicPath` includes `basePath`, and must ship the `headers()` recipe. Never suggest importing the sprite through the bundler.
