# TSK-004 spike: delivering the hashed sprite URL without a bundler plugin

_Date: 2026-10-08. Throwaway prototype, evidence only. Decision: [ADR-0010](../../docs/adr/0010-sprite-url-delivery-generated-module-and-public-path.md)._

Setup: Node 24.13, Next.js 16.4.0 (Turbopack, the default for `next build`), React 19.3.0, TypeScript 6.0.3, Playwright 1.58.2 (bundled Chromium, Firefox, WebKit), macOS. Every browser context runs with **JavaScript disabled**.

## What it builds

- `icons/`: four self-authored icons, one per delivery path of [ADR-0006](../../docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md):
  - `home` (mono fill) and `ui/check` (mono stroke) go to the sprite and render through `use`;
  - `brand/sunset` (multicolor + gradient) goes to the stack and renders as `img`;
  - `café` (mono + clipPath, non-ASCII id) goes to the stack and renders as `mask`.
- `src/generate.mjs`: a prototype of the contract.
  - It writes `icons.<sha256:8>.svg` and `icons.stack.<sha256:8>.svg` to an output dir.
  - It writes `icons.js`, `icons.d.ts`, and `manifest.json` to a module dir.
  - It validates `publicPath`, and removes stale hashed files it owns.
- `next-app/`: a Next 16 App Router app.
  - `app/_ui/create-icon.tsx` stands in for `@svgworm/react`: a factory that binds the generated `manifest` and returns a hook-free Server Component with the three render branches.
  - `next.config.ts` adds the `Cache-Control: immutable` recipe for `/icons/:file*`, and reads an optional `basePath` from the environment.
- `plain-html/`: a static HTML template whose placeholders are filled from `manifest.json` by `render.mjs`. It stands in for any server template or SSG. It is served by a bare `node:http` static server.
- `src/check.mjs`: runs everything and writes `results/results.md`, `results/results.json`, and `results/shots/`.

Run with `pnpm install && pnpm check`.

## Results

All 36 checks pass, including one that aggregates the 36 renders. Two consecutive runs gave an identical `results.json`. Full table: [results/results.md](results/results.md).

| Check | Plain HTML | Next 16 | Next 16 + `basePath: '/docs'` |
|---|---|---|---|
| Renders `use` / `img` / `mask` in Chromium, Firefox, WebKit, JS off (12 per target) | ✅ 12/12 | ✅ 12/12 | ✅ 12/12 |
| Mono icons follow `color: #ff0000` (≥ 99% of painted pixels red) | ✅ | ✅ | ✅ |
| Every `.svg` request same-origin and `200` | ✅ | ✅ | ✅ |
| Sprite and stack served as `image/svg+xml` with `public, max-age=31536000, immutable` | ✅ (static server) | ✅ (`headers()` recipe) | ✅ (`headers()` source is basePath-relative) |
| SSR HTML contains the hashed URLs | – | ✅ | ✅ `/docs/icons/icons.7f8d9abd.svg` |
| Manifest absent from client JS (`.next/static` has no symbol id or sprite file name) | – | ✅ | ✅ |
| `next build` type-checks; `<Icon name="nope" />` is a type error (`@ts-expect-error` holds, `tsc --noEmit` passes) | – | ✅ | ✅ |
| The same file without the basePath prefix (`/icons/…`) | – | – | 404, so `publicPath` must include `basePath` |

Contract checks:

- File names are the same for `publicPath` `/icons` and `/docs/static/icons/`, so the hash comes from content only.
- A trailing `/` is normalized.
- A rerun gives a byte-identical module and files.
- These `publicPath` values exit with code 2: `icons`, `./icons`, `//cdn.example.com/icons`, `https://cdn.example.com/icons`, `/icons?v=1`.
- Stale `icons.<8hex>.svg` files are removed, and a foreign `robots.txt` in the same dir is kept.

Negative control: a page that points at a stale hash renders blank. `<use>` paints 0%. The broken `<img>` shows a broken-image glyph (Chromium 1.4%, Firefox 4.0% painted) or collapses (WebKit). So the render threshold (> 10% painted; the thinnest icon paints 12.5%) can fail.

## Observations

- **Next serves `public/` with `Cache-Control: public, max-age=0`** ([docs](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/03-file-conventions/public-folder.mdx)). Hashed names are only worth it with the `headers()` recipe. Next's own "can't override" rule covers only its own hashed assets (`/_next/static`), not `public/`, and the recipe takes effect in `next start`.
- **`basePath` is not added to raw `href`/`src` strings.** Next documents this for `next/image` `src` ([basePath docs](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/basePath.mdx)), and the 404 check confirms it for `<use href>`. `publicPath` has to be `/docs/icons`.
- **`assetPrefix` does not apply to `public/`** ([assetPrefix docs](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/assetPrefix.mdx)). So `public/` stays same-origin even when `/_next/static` moves to a CDN. That is what ADR-0006 needs, because every engine blocks a cross-origin `<use>`. A bundler-imported sprite would follow `assetPrefix` to the CDN and break.
- **The stack file is requested once per consumer type on a cold load.** Chromium and WebKit log 2 responses for the stack (one for `<img>`, one for the CSS `mask`), and Firefox logs 3. The sprite is requested once. With the immutable header, later loads come from cache. This was not investigated further. It adds to ADR-0006's "cost of many stack images" item, which was not measured.
- A `.js` + `.d.ts` pair works with `allowJs: false` and `moduleResolution: bundler`. The import uses an explicit `.js` extension, so it also resolves under `nodenext`.

## Not covered

- `next dev`, and HMR when the module is regenerated during dev. That belongs to watch mode (TSK-013).
- Real Safari and iOS. The same manual check before release as ADR-0006.
- Hand-written HTML with no template step. The hashed name can't be known without reading the manifest (see ADR-0010, Consequences).
- Vite and Astro (TSK-024).
