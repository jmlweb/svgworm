# 0010. Sprite URL delivery: a generated module and JSON manifest with a configured `publicPath`

- **Status:** accepted
- **Date:** 2026-10-08
- **Task:** TSK-004
- **Resolves:** Q-20, Q-24, Q-05 (field names, v0.1), Q-21 for Next.js App Router and plain HTML. Q-21 for Vite and Astro goes to TSK-024. Q-23 (preload) and Q-25 (inline form) stay deferred past v0.1 ([ADR-0005](0005-build-standalone-with-kill-criteria.md)).

## Context

The default delivery is an external, content-hashed sprite ([ADR-0001](0001-external-sprite-default.md), [ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md)). Icons with `url(#…)` references go to a second hashed file, the stack. The app needs both hashed URLs at render time.

The old prototype on `main` wrote `sprite.<md5>.svg` but nothing told the app its name (LRN-002, [viability](../viability.md)). svgworm can't depend on a bundler plugin to close that gap: the TSK-007 spike saw a webpack plugin break under Next 16 + Turbopack (LRN-008, [ADR-0008](0008-tech-stack-and-package-layout.md)).

Forces:

- **Zero JS** (principle 1). Server Components must render the icon with no client code, and the URL must be known at build time, not fetched.
- **Same origin** (ADR-0006, Q-02). Every engine blocks a cross-origin `<use>`, even with CORS.
- **Deterministic output** (principle 2). The file names must depend on content only.
- **Agnostic core** (principle 3). The core emits data. Adapters consume it and never re-process SVGs.
- **Types are the product** (principle 4). The same module that carries URLs must carry the name union.
- **Scope** ([TSK-014](../../.backlog/tasks/complete/TSK-014-re-plan-backlog-for-lean-v01.md) re-plan, PLN-001): verify only Next.js 16 App Router and plain HTML in v0.1.

## Options considered

### How the URL reaches the app

1. **The CLI writes the files to a public directory and generates a module with the final URLs.** The URL is `publicPath` + file name, written as string constants. Chosen.
   - It works with any framework that serves a static folder, and with any server that does.
   - The module is plain data, so it costs nothing in Server Components.
   - It needs a correct `publicPath` from the user.
2. **The generated module imports the SVG as a bundler asset** (`import url from './icons.svg'`, or `new URL('./icons.svg', import.meta.url)`). The bundler hashes the file and serves it immutable for free. Rejected:
   - the result differs by bundler: Next returns a `StaticImageData` object, Vite returns a string, and plain HTML or Node has no bundler at all;
   - in Next, bundler assets follow `assetPrefix`, which usually points at a CDN. A sprite on another origin breaks every `<use>` (ADR-0006). `public/` is not affected by `assetPrefix` ([Next docs](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/assetPrefix.mdx));
   - it is exactly the bundler coupling ADR-0008 avoids.
3. **A bundler or framework plugin.** Rejected by ADR-0005 and ADR-0008 (TSK-007 evidence).
4. **The adapter fetches the manifest at runtime.** That is a network request plus JS, or server I/O on every render. It violates principle 1 and the contract's "never at runtime over the network" rule. Rejected.
5. **Stable file names with no hash** (`icons.svg` plus `?v=` or ETag revalidation). Hand-written HTML could reference it directly. But it gives up immutable caching, and a query string is ignored by some caches. Not in v0.1. See Consequences.

### Where the base path comes from

1. **A `publicPath` value in config, overridable by a CLI flag (R-32), resolved at generation time.** Chosen.
   - It is deterministic, visible in the generated file, and works in any environment that can run the CLI before the build.
   - A deploy that varies the path passes it as a flag, for example `svgworm build --public-path "$BASE_PATH/icons"`.
2. **An environment variable read at runtime** (`process.env.NEXT_PUBLIC_…`). It couples generated code to a framework's env conventions and makes the module non-deterministic. Rejected.
3. **A prop on every `<Icon>`, or adapter-level context.** Context is impossible in Server Components (architecture.md), and a per-call prop is noise. Rejected. The manifest also keeps the bare file name, so an adapter may later offer a factory-level override without a contract change.
4. **Derive it from the output dir** (`public/icons` → `/icons`). That is framework knowledge in the core, and it is wrong under a Next `basePath`. Rejected as an implicit rule. Kept only as the one fixed default below, which `svgworm init` (TSK-015) can propose per framework.
5. **Relative URLs** (`icons/…`). They resolve against the page URL, so they break on nested routes (`/blog/post` → `/blog/icons/…`). Rejected.

### Module format

1. **`icons.js` (ESM, data only) + `icons.d.ts`, plus `manifest.json` with the same object.** Chosen.
   - A JS project, a TS project with `allowJs: false`, and a Node script can all import the `.js` file. The spike verified this under `moduleResolution: bundler`, and the explicit `.js` specifier also resolves under `nodenext`.
   - The JSON form serves non-JS consumers (PHP, Python, or Go templates, SSGs, agents) and `svgworm check`.
2. **`icons.ts`.** One file, but a JS project or a plain `node` script can't import it everywhere. Importing it with its extension needs `allowImportingTsExtensions`. Rejected.
3. **JSON only, imported with `with { type: 'json' }`.** JSON can't carry the `IconName` union, so the types would need a second file anyway. Rejected as the primary path, kept as the secondary form.

### Hash (Q-24)

1. **The first 8 lowercase hex characters of SHA-256 over the exact emitted bytes.** Chosen.
   - Hex is safe on case-insensitive file systems (macOS, Windows), unlike base64url.
   - The hash only has to tell successive versions of one file name apart. The chance that a changed file keeps its name is 2⁻³², about 2 × 10⁻⁶ over 10,000 changes.
   - It matches the length used in the TSK-007 setup.
2. **Longer hashes** (16 to 20 hex, as webpack uses). Safer by orders of magnitude we don't need, at the cost of longer URLs in every rendered icon. Rejected.
3. **Hash of the source files or the config.** That breaks "content only" when svgo or the svgworm version changes the output but not the input. Rejected.

## Decision

### Files and names (Q-24)

| File | Name | Written to |
|---|---|---|
| Sprite (`use` icons) | `<group>.<hash>.svg` | `outDir` |
| Stack (`img`/`mask` icons, ADR-0006) | `<group>.stack.<hash>.svg` | `outDir` |
| Module | `icons.js` + `icons.d.ts` | `moduleDir` |
| JSON manifest | `manifest.json` | `moduleDir` |

- `<hash>` is the first 8 lowercase hex characters of SHA-256 over the file's exact bytes. `publicPath`, absolute paths, and timestamps never feed it.
- v0.1 has exactly one group, named `icons`. Multiple groups are post-v0.1 (Q-22, TSK-021). When they come, group names must not contain `.`, so `<group>.stack.<hash>` stays unambiguous.
- A file with no icons is not written, and its manifest entry is `null`. With no reference-dependent icons, for example, there is no stack file.
- **Ownership (R-15):** `outDir` may hold other files. svgworm deletes only files matching `^icons(\.stack)?\.[0-9a-f]{8}\.svg$` that the current build did not produce.
- **Write order:** new sprite and stack files first, then the module and manifest, then stale files are removed. A dev server that reloads on the module change never points at a missing file.
- On any build error (R-04), nothing is written or deleted.

### `publicPath`

- **The URL of a file** is `publicPath + "/" + file name`.
- **Allowed values:** `publicPath` must start with a single `/`. It must not contain `?`, `#`, `\`, or whitespace. Trailing `/` are removed, and `/` alone means the site root.
- **Rejected values:** relative paths, protocol-relative paths (`//host`), and absolute `http(s):` URLs exit with code 2 and a message citing the same-origin rule. Same-origin absolute URLs and a cross-origin workaround (Q-02) can be added later without breaking anything.
- **It must include the app's mount point.** Under Next `basePath: '/docs'`, use `/docs/icons`. Next does not prefix raw `href` strings, and the unprefixed URL is a 404.
- **Defaults:** `outDir` defaults to `public/icons` and `publicPath` to `/icons`. That works as-is for Next.js, Vite, and Astro, which all serve `public/` at the root. If `outDir` is set and `publicPath` is not, it is a config error (exit 2), never a guess.
- `moduleDir` defaults to `svgworm/` next to the config file. It must not be inside a served directory.
- **Key names:** `outDir`, `publicPath`, `moduleDir`, and the flag `--public-path` are working names. The config schema (TSK-011) may rename them, but not change their meaning.

### Manifest (Q-20, Q-05 field names)

`manifest.json` and the `manifest` export of `icons.js` are the same object:

```json
{
  "version": 1,
  "sprites": {
    "icons": {
      "sprite": { "file": "icons.7f8d9abd.svg", "url": "/icons/icons.7f8d9abd.svg" },
      "stack": { "file": "icons.stack.a506a052.svg", "url": "/icons/icons.stack.a506a052.svg" }
    }
  },
  "icons": {
    "brand/sunset": { "sprite": "icons", "id": "i-brand--sunset", "viewBox": "0 0 24 24", "color": "multicolor", "delivery": "img" },
    "home": { "sprite": "icons", "id": "i-home", "viewBox": "0 0 24 24", "color": "mono", "delivery": "use" }
  }
}
```

- **`version`** is the contract version. An adapter that doesn't know it fails loudly.
- **`icons`** keys are public names, sorted by code point. `id` is the symbol id ([ADR-0007](0007-icon-naming-and-collision-policy.md)), `color` comes from [ADR-0004](0004-per-icon-color-classification.md), and `delivery` (`use | img | mask`) from ADR-0006.
- **The URL an icon needs** is `sprites[icon.sprite].sprite.url` for `use`, or `sprites[icon.sprite].stack.url` for `img` and `mask`. Then append `#` + `id`. Ids need no escaping (ADR-0007).
- **`icons.d.ts`** declares `export type IconName` (a plain sorted union in v0.1, per Q-30) and `export declare const manifest`, with `icons` typed as `Readonly<Record<IconName, …>>`.
- **The generated code imports nothing** (ADR-0008).

### Consuming it

- **React** (shape for TSK-012): the adapter can't import a user path, so the user binds the module once:

  ```ts
  import { manifest } from '@/svgworm/icons.js';
  export const Icon = createIcon(manifest);
  ```

  `createIcon` must return a hook-free, context-free component whose `name` prop is typed from the manifest's keys.
- **Next.js 16 App Router** (TSK-016, docs):
  - keep the defaults, and run `svgworm build` in `prebuild`/`predev`;
  - add `headers()` with `source: '/icons/:file*'` and `Cache-Control: public, max-age=31536000, immutable`, because Next serves `public/` with `max-age=0`;
  - under `basePath`, set `publicPath` to `<basePath>/icons`. The `headers()` source stays `/icons/:file*`, because it is basePath-relative.
- **Plain HTML:**
  - serve `outDir` from the page's own origin, with the same immutable header for `*.<8hex>.svg`;
  - read `manifest.json` in whatever produces the HTML (a server template, an SSG, a build script) and write the markup from `delivery`, as in [output-contract.md](../output-contract.md#adapter-expectations-react).

## Evidence

- **The [TSK-004 spike](../../spikes/TSK-004-sprite-url/RESULTS.md)** passed all 36 checks, and two runs gave an identical `results.json`. It covers Next.js 16.4.0 with Turbopack, Next with `basePath: '/docs'`, and a plain HTML page from a bare static server. Each was checked in Chromium, Firefox, and WebKit (Playwright 1.58.2) with JavaScript disabled:
  - 36/36 icon renders paint and follow `color`, covering all three deliveries;
  - every sprite request is same-origin and returns `200 image/svg+xml` with the immutable header;
  - `.next/static` contains no manifest data, so there is zero client JS;
  - `<Icon name="nope" />` is a type error under `next build` and `tsc`;
  - the unprefixed URL under `basePath` is a 404;
  - file names don't change with `publicPath`, a rerun is byte-identical, invalid `publicPath` values exit 2, and stale-file cleanup keeps foreign files;
  - a stale-hash negative control renders blank, so the render check can fail.
- **Next.js 16 docs (v16.2.9):**
  - [public folder](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/03-file-conventions/public-folder.mdx): `Cache-Control: public, max-age=0` by default;
  - [assetPrefix](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/assetPrefix.mdx): applies only to `_next/static`, not to `public/`;
  - [basePath](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/basePath.mdx): it must be included by hand in `src` strings;
  - [headers](https://github.com/vercel/next.js/blob/v16.2.9/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.mdx): only Next's own hashed assets have a fixed `Cache-Control`.
- **The [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md):** a prebuild script plus a generated module works with Turbopack and Server Components, and the plugin path doesn't.
- **ADR-0006:** same-origin is required in every engine.

## Consequences

- **The output contract gains a concrete manifest** with `version`, `sprites.<group>.{sprite,stack}.{file,url}`, and `icons.<name>.{sprite,id,viewBox,color,delivery}`. Changing it now needs an ADR and a semver note. TSK-008 freezes it.
- **TSK-011** (config schema) adds `outDir`, `publicPath`, and `moduleDir` with the rules above. TSK-012 (React) implements `createIcon(manifest)`. TSK-016 (Next example) uses the `headers()` recipe and a `basePath` variant. TSK-013 (`check`) can compare `manifest.json`.
- **The user must keep `publicPath` and the framework's mount point in sync.** A mismatch is a 404 that svgworm can't see at build time. The docs must show the `basePath` case, and `svgworm init` (TSK-015) should propose the value.
- **Hand-written HTML** with no template or build step can't know the hashed name. v0.1 doesn't serve that case. An opt-in stable name (option 5 under "How the URL reaches the app") is a possible post-v0.1 addition.
- **The stack file is requested once per consumer type** (`<img>` and CSS `mask`) on a cold load. Chromium and WebKit fetch it twice and Firefox three times, and with the immutable header the repeats come from cache later. This adds to ADR-0006's "cost of many stack images", which is still unmeasured.
- **Preload (Q-23) and the inline form (Q-25) stay deferred.** The manifest already has the URLs a preload helper would need.
- **Vite and Astro recipes are TSK-024.** The defaults (`public/icons`, `/icons`) already match their `public/` convention, but this is not verified.
