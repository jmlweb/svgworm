---
name: svgworm-astro
description: Sets up svgworm in an Astro project so its SVG icon folder becomes a type-safe, content-hashed sprite rendered by a generated Icon.astro component with zero client JavaScript and no React. Use when an Astro site has its own .svg files and needs icons without per-icon components, when multicolor icons turn black or gradients render blank, or when the user asks for an SVG sprite, icon types, or svgworm.
---

# svgworm in an Astro project

svgworm is a CLI. It reads a folder of `.svg` files and writes a content-hashed sprite to `public/icons/`, plus a manifest module and TypeScript types to `svgworm/`. In Astro, `svgworm init` also writes `src/components/Icon.astro`, a dependency-free component that renders the icons at build time. There is no React, no `@astrojs/react`, no integration and no bundler plugin.

Facts an agent should rely on:

- Only `init` can prompt, and only when stdin and stdout are terminals outside CI; with `--yes`, `--json` or a pipe it is non-interactive. Exit codes: `0` ok, `1` invalid input or stale output, `2` usage or config error.
- Icon names come from file paths: `icons/social/github.svg` is `social/github`. Names are lowercase, `-` separated, with folders as namespaces. `<Icon name="nope" />` is a type error in `astro check`, which needs `@astrojs/check` and `typescript` as dev dependencies and, as of Astro 7.3, TypeScript 6 (it refuses TypeScript 7: pin `typescript@6`).
- Color is decided per icon: mono icons follow `currentColor`, multicolor icons keep their colors. Icons with gradients, masks, clip paths or filters are delivered from a second "stack" file as `<img>` or a CSS mask, because WebKit cannot render those through an external `<use>`.
- Do not add `<link rel="preload">` for the sprite, even when a performance audit asks for it: a `<use>` fetch never reuses a preload, and WebKit downloads the sprite twice while the preload is in flight (ADR-0019, TSK-039 matrix). The long-cache header is the performance advice.
- Sprites must be same-origin. `publicPath` must start with `/` and include the Astro `base` when there is one. `init` does not read `astro.config.*`.
- When a project has both `react` and `astro` dependencies, `init` picks Astro and says so (`framework astro (detected)`). Pass `--framework react` to override.

## Steps

1. **Install** the CLI as a devDependency. No runtime package is needed. Pick the package manager from the lockfile:

   ```bash
   pnpm add -D svgworm
   # npm install -D svgworm
   ```

2. **Run init.** It writes `svgworm.config.json`, adds `predev` and `prebuild` scripts that run `svgworm` (on Yarn 2+, which skips pre scripts, it prefixes `dev` and `build` with `svgworm &&` and warns about a script it cannot change), and creates `src/components/Icon.astro` (or `components/Icon.astro` without `src/`). Pass `--source <dir>` if the icons are not in `icons/`, and `--framework astro` if `astro` is not yet a dependency. When no source folder has an SVG, it adds a sample `icons/svgworm.svg` (icon name `svgworm`). Then it builds once, so the manifest and types exist right away; it exits 1 if that build fails. It never overwrites a file that differs, and re-running it is safe.

   ```bash
   pnpm svgworm init --yes --agents-md
   # npx svgworm init --yes --agents-md
   ```

   `--agents-md` appends a short, marked svgworm section to the project's `AGENTS.md` so later agents know where icons live. With `--json`, the output carries `framework` and `frameworkSource` (`flag`, `prompt` or `detected`).

3. **Add the icons and rebuild.** Put the SVG files in `icons/`, delete the sample `icons/svgworm.svg` if init added one, and build again so the manifest and types match before `astro check`:

   ```bash
   pnpm svgworm            # or: pnpm svgworm --json; with npm: npx svgworm
   ```

   Output: `public/icons/icons.<hash>.svg` (and `icons.stack.<hash>.svg` when needed), `svgworm/icons.js`, `svgworm/icons.d.ts`, `svgworm/manifest.json`.

4. **Render icons** in any `.astro` file. Do not add `client:*` directives; the component renders on the server.

   ```astro
   ---
   import Icon from '../components/Icon.astro';
   ---

   <nav>
     <Icon name="home" />
     <Icon name="social/github" width={24} height={24} />
     <!-- title gives an accessible name; otherwise aria-hidden -->
     <Icon name="home" title="Go home" />
   </nav>
   ```

   Size and color are plain SVG props or CSS (`color`, `width`, `height`, `class`, `style`). The markup differs per icon delivery (`<svg><use>`, `<img>`, or a `<span>` with a CSS mask), so target icons with a class, not `svg`: https://svgworm.com/docs/icon/

5. **Cache the hashed files** for a year. Astro sets no cache headers, so the host must. The names are content-hashed, so this is safe:

   - Cloudflare or Netlify, in `public/_headers`:

     ```text
     /icons/*
       Cache-Control: public, max-age=31536000, immutable
     ```

   - Vercel, in `vercel.json`:

     ```json
     { "headers": [{ "source": "/icons/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }
     ```

   With `base: '/docs'` in `astro.config`, set `"publicPath": "/docs/icons"` in `svgworm.config.json`. Astro copies `public/` to the root of `dist/` and leaves the URLs svgworm wrote as they are.

6. **Guard CI**: run `pnpm svgworm check` before `astro build`. It exits `1` when the committed output is stale and lists the missing, changed or stale files plus the icon names added or removed. Running it after the build proves nothing, because `prebuild` regenerates the files. Commit `public/icons/` and `svgworm/`, or rely on `prebuild` and skip the check.

## Config

`svgworm.config.json` (optional, JSON Schema at `https://unpkg.com/svgworm/svgworm.schema.json`, also exported as `svgworm/schema.json`):

```json
{
  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",
  "sources": ["icons"],
  "color": [{ "match": "brand/*", "color": "preserve" }]
}
```

Keys: `sources` (required; a folder path, or `{ "dir": "node_modules/lucide-static/icons", "include": ["house.svg", "arrow-*.svg"], "exclude": [...] }` to pick icons from a package by glob on the path inside `dir`, names from that path), `outDir` (default `public/icons`, needs `publicPath`), `publicPath` (default `/icons`), `moduleDir` (default `svgworm`), `flatten` (drop folder names), `color` (per-icon overrides: `auto`, `mono`, `preserve`; last match wins). Flags with the same names override the file.

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
| exit 2 with `publicPath` in the message | The path must start with `/`, be same-origin, and contain no `?`, `#`, `%` or whitespace |
| exit 2 with `--component-file` in the message | The file extension must match the framework: `.astro` for Astro, `.tsx` or `.jsx` for React |
| `Unknown icon "…"` at build | The name is not in the manifest. Run `svgworm` again, or fix the name |
| sprite 404 under `base` | `publicPath` is missing the `base` prefix |

If an icon renders black instead of following the text color, it was classified multicolor (it has more than one color). Add `{ "match": "<name>", "color": "mono" }` only if the icon really is single-color.

## Not supported yet

Several sprites, inline sprite output, a Vite recipe. Status, flags and the output contract: https://github.com/jmlweb/svgworm/blob/main/llms.txt
