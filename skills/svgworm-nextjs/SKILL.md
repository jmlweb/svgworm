---
name: svgworm-nextjs
description: Sets up svgworm in a Next.js App Router project so its SVG icon folder becomes a type-safe, content-hashed sprite rendered by a Server Component with zero client JavaScript. Use when a Next.js (or React 19) app has its own .svg files and needs icons without per-icon components, when multicolor icons turn black or gradients render blank, or when the user asks for an SVG sprite, icon types, or svgworm.
---

# svgworm in a Next.js App Router app

svgworm is a CLI. It reads a folder of `.svg` files and writes a content-hashed sprite to `public/icons/`, plus a manifest module and TypeScript types to `svgworm/`. `@svgworm/react` turns that manifest into a hook-free `Icon` component for Server Components. There is no bundler plugin, so it works under Turbopack and webpack alike.

Facts an agent should rely on:

- Only `init` can prompt, and only when stdin and stdout are terminals outside CI; with `--yes`, `--json` or a pipe it is non-interactive. Exit codes: `0` ok, `1` invalid input or stale output, `2` usage or config error.
- Icon names come from file paths: `icons/social/github.svg` is `social/github`. Names are lowercase, `-` separated, with folders as namespaces. `<Icon name="nope" />` is a type error.
- Color is decided per icon: mono icons follow `currentColor`, multicolor icons keep their colors. Icons with gradients, masks, clip paths or filters are delivered from a second "stack" file as `<img>` or a CSS mask, because WebKit cannot render those through an external `<use>`.
- Do not add `<link rel="preload">` for the sprite, even when a performance audit asks for it: a `<use>` fetch never reuses a preload, and WebKit downloads the sprite twice while the preload is in flight (ADR-0019, TSK-039 matrix). The long-cache header is the performance advice.
- Sprites must be same-origin. `publicPath` must start with `/` and include the Next `basePath` when there is one.
- Never import `Icon` from a `'use client'` file: that pulls the whole manifest (`svgworm/icons.js`, about 200 bytes per icon) into the client chunk. Render the icon in a Server Component and pass it to the client component as a prop or as children.

## Steps

1. **Install** (devDependency for the CLI, dependency for the adapter). Pick the project's package manager from its lockfile:

   ```bash
   pnpm add -D svgworm && pnpm add @svgworm/react
   # npm install -D svgworm && npm install @svgworm/react
   ```

2. **Run init.** It writes `svgworm.config.json`, adds `predev` and `prebuild` scripts that run `svgworm` (on Yarn 2+, which skips pre scripts, it prefixes `dev` and `build` with `svgworm &&` and warns about a script it cannot change), and creates the Icon wiring (`components/icon.tsx`, or `src/components/icon.tsx` when `src/` exists). Pass `--source <dir>` if the icons are not in `icons/`. When no source folder has an SVG, it adds a sample `icons/svgworm.svg` (icon name `svgworm`). Then it builds once, so the manifest and types exist right away; it exits 1 if that build fails. It never overwrites a file that differs, and re-running it is safe.

   ```bash
   pnpm svgworm init --yes --agents-md
   # npx svgworm init --yes --agents-md
   ```

   `--agents-md` appends a short, marked svgworm section to the project's `AGENTS.md` so later agents know where icons live.

3. **Add the icons and rebuild.** Put the SVG files in `icons/`, delete the sample `icons/svgworm.svg` if init added one, and build again so the manifest and types match before type-checking:

   ```bash
   pnpm svgworm            # or: pnpm svgworm --json; with npm: npx svgworm
   ```

   Output: `public/icons/icons.<hash>.svg` (and `icons.stack.<hash>.svg` when needed), `svgworm/icons.js`, `svgworm/icons.d.ts`, `svgworm/manifest.json`.

4. **Render icons** in any Server Component. Do not add `'use client'` to the icon file.

   ```tsx
   import { Icon } from '@/components/icon';

   export const Nav = () => (
     <nav>
       <Icon name="home" />
       <Icon name="social/github" width={24} height={24} />
       {/* title gives an accessible name; otherwise aria-hidden */}
       <Icon name="home" title="Go home" />
     </nav>
   );
   ```

   Size and color are plain SVG props or CSS (`color`, `width`, `height`, `className`, `style`). The markup differs per icon delivery (`<svg><use>`, `<img>`, or a `<span>` with a CSS mask), so target icons with a class, not `svg`: https://svgworm.com/docs/icon/

5. **Cache the hashed files** for a year in `next.config.ts`. Next serves `public/` with `max-age=0`, and the names are content-hashed, so this is safe:

   ```ts
   export default {
     async headers() {
       return [
         {
           source: '/icons/:file*',
           headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
         },
       ];
     },
   };
   ```

   With `basePath: '/docs'`, set `"publicPath": "/docs/icons"` in `svgworm.config.json` (and keep `source: '/icons/:file*'`, which is basePath-relative).

6. **Guard CI**: `pnpm svgworm check` exits `1` when the committed output is stale and lists the missing, changed or stale files plus the icon names added or removed. Commit `public/icons/` and `svgworm/`, or rely on `prebuild` and skip the check.

## Config

`svgworm.config.json` (optional, JSON Schema at `https://unpkg.com/svgworm/svgworm.schema.json`, also exported as `svgworm/schema.json`):

```json
{
  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",
  "sources": ["icons"],
  "color": [{ "match": "brand/*", "color": "preserve" }]
}
```

Keys: `sources` (default `icons`; a folder path, or `{ "dir": "node_modules/lucide-static/icons", "include": ["house.svg", "arrow-*.svg"], "exclude": [...] }` to pick icons from a package by glob on the path inside `dir`, names from that path), `outDir` (default `public/icons`; `publicPath` is derived under `public/`, otherwise required), `publicPath` (default `/icons`; never includes `basePath` or `base` unless you add it), `moduleDir` (default `svgworm`), `flatten` (drop folder names), `color` (per-icon overrides: `auto`, `mono`, `preserve`; last match wins). Flags with the same names override the file.

## Fixing errors

Diagnostics print to stderr as `[code] file: message`, and `--json` returns them in `errors`. The human version of this table, plus fixes for a blank icon in Safari, a sprite 404 and a wrong color, is at https://svgworm.com/docs/troubleshooting/.

| Code | Fix |
|------|-----|
| `name/collision` | Two files map to one name (`arrow_left.svg` and `arrow-left.svg`, or the same name in two folders with `flatten`). Rename one; svgworm never renames silently |
| `name/case-folded` (warning) | `ArrowLeft.svg` is named `arrowleft`: letter case is never split. Rename the file to the suggested `arrow-left.svg` if the readable name matters, and update the `name` props |
| `svg/not-svg-root`, `svg/invalid-xml`, `svg/invalid-encoding` | The file is not a valid UTF-8 SVG. Re-export it |
| `svg/forbidden-element`, `svg/forbidden-attribute`, `svg/external-reference` | `<script>`, `on*` event handlers and references to other files (`href`, `url(...)`) are rejected. Remove them or inline the asset |
| `viewbox/underivable` | No `viewBox` and no plain-number `width`/`height`. Add a `viewBox` |
| `viewbox/invalid` | The `viewBox` is not four numbers with a positive width and height. Fix it, or remove it so it is derived from plain-number `width`/`height` |
| `io/unreadable` | A source file cannot be read. Check its permissions, or remove it |
| `style/unscopable` | A `<style>` rule (for example `@media`) cannot be inlined. Convert it to attributes |
| `color/forced-mono-unsafe` | A `color: mono` rule would recolor a multicolor icon. Use `preserve` or drop the rule |
| `build/no-icons` (exit 2) | The source folder has no `.svg` files. Check `sources` |
| exit 2 with `publicPath` in the message | The path must start with `/`, be same-origin, and contain no `?`, `#`, `%` or whitespace. A CDN URL (`https://…`) needs `"crossOrigin": "inject"`, which makes icons need a loader script: prefer proxying `/icons/*` through the site (https://svgworm.com/docs/config/#sprites-on-a-cdn) |
| `use` icons blank with `crossOrigin: "inject"` | The loader tag is missing (render it once: `createSpriteLoader(manifest)` in the root layout, or `SvgwormLoader.astro` in the layout head), or the console shows `svgworm: sprite not loaded from …` (CORS header or CSP `connect-src` missing on the CDN) |

If an icon renders black instead of following the text color, it was classified multicolor (it has more than one color). Add `{ "match": "<name>", "color": "mono" }` only if the icon really is single-color.

## Not supported yet

Several sprites in one build (use one config per sprite: https://svgworm.com/docs/config/#several-sprites), inline sprite output (not planned, ADR-0024), frameworks other than React, Astro, Vue and Svelte. Status, flags and the output contract: https://github.com/jmlweb/svgworm/blob/main/llms.txt
