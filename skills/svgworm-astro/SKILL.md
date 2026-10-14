---
name: svgworm-astro
description: Sets up svgworm in an Astro project so its SVG icon folder becomes a type-safe, content-hashed sprite rendered by a generated Icon.astro component with zero client JavaScript and no React. Use when an Astro site has its own .svg files and needs icons without per-icon components, when multicolor icons turn black or gradients render blank, or when the user asks for an SVG sprite, icon types, or svgworm.
---

# svgworm in an Astro project

svgworm is a CLI. It reads a folder of `.svg` files and writes a content-hashed sprite to `public/icons/`, plus a manifest module and TypeScript types to `svgworm/`. In Astro, `svgworm init` also writes `src/components/Icon.astro`, a dependency-free component that renders the icons at build time. There is no React, no `@astrojs/react`, no integration and no bundler plugin.

Facts an agent should rely on:

- Everything is non-interactive when stdout is not a TTY or with `--yes`/`--json`. Exit codes: `0` ok, `1` invalid input or stale output, `2` usage or config error.
- Icon names come from file paths: `icons/social/github.svg` is `social/github`. Names are lowercase, `-` separated, with folders as namespaces. `<Icon name="nope" />` is a type error in `astro check`.
- Color is decided per icon: mono icons follow `currentColor`, multicolor icons keep their colors. Icons with gradients, masks, clip paths or filters are delivered from a second "stack" file as `<img>` or a CSS mask, because WebKit cannot render those through an external `<use>`.
- Sprites must be same-origin. `publicPath` must start with `/` and include the Astro `base` when there is one. `init` does not read `astro.config.*`.
- When a project has both `react` and `astro` dependencies, `init` picks Astro and says so (`framework astro (detected)`). Pass `--framework react` to override.

## Steps

1. **Install** the CLI as a devDependency. No runtime package is needed. Pick the package manager from the lockfile:

   ```bash
   pnpm add -D svgworm
   # npm install -D svgworm
   ```

2. **Run init.** It writes `svgworm.config.json`, adds `predev` and `prebuild` scripts that run `svgworm`, and creates `src/components/Icon.astro` (or `components/Icon.astro` without `src/`). Pass `--source <dir>` if the icons are not in `icons/`, and `--framework astro` if `astro` is not yet a dependency. It never overwrites a file that differs, and re-running it is safe.

   ```bash
   pnpm svgworm init --yes --agents-md
   ```

   `--agents-md` appends a short, marked svgworm section to the project's `AGENTS.md` so later agents know where icons live. With `--json`, the output carries `framework` and `frameworkSource` (`flag` or `detected`).

3. **Build once** so the manifest and types exist before `astro check`:

   ```bash
   pnpm svgworm            # or: pnpm svgworm --json
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

   Size and color are plain SVG props or CSS (`color`, `width`, `height`, `class`, `style`).

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

Keys: `sources` (required), `outDir` (default `public/icons`, needs `publicPath`), `publicPath` (default `/icons`), `moduleDir` (default `svgworm`), `flatten` (drop folder names), `color` (per-icon overrides: `auto`, `mono`, `preserve`; last match wins). Flags with the same names override the file.

## Fixing errors

Diagnostics print to stderr as `[code] file: message`, and `--json` returns them in `errors`.

| Code | Fix |
|------|-----|
| `name/collision` | Two files map to one name (`arrow_left.svg` and `arrow-left.svg`, or the same name in two folders with `flatten`). Rename one; svgworm never renames silently |
| `svg/not-svg-root`, `svg/invalid-xml`, `svg/invalid-encoding` | The file is not a valid UTF-8 SVG. Re-export it |
| `svg/forbidden-element`, `svg/forbidden-attribute`, `svg/external-reference` | `<script>`, `on*` event handlers and references to other files (`href`, `url(...)`) are rejected. Remove them or inline the asset |
| `viewbox/underivable` | No `viewBox` and no plain-number `width`/`height`. Add a `viewBox` |
| `style/unscopable` | A `<style>` rule (for example `@media`) cannot be inlined. Convert it to attributes |
| `color/forced-mono-unsafe` | A `color: mono` rule would recolor a multicolor icon. Use `preserve` or drop the rule |
| `build/no-icons` (exit 2) | The source folder has no `.svg` files. Check `sources` |
| exit 2 with `publicPath` in the message | The path must start with `/`, be same-origin, and contain no `?`, `#`, `%` or whitespace |
| exit 2 with `--component-file` in the message | The file extension must match the framework: `.astro` for Astro, `.tsx` or `.jsx` for React |
| `Unknown icon "…"` at build | The name is not in the manifest. Run `svgworm` again, or fix the name |
| sprite 404 under `base` | `publicPath` is missing the `base` prefix |

If an icon renders black instead of following the text color, it was classified multicolor (it has more than one color). Add `{ "match": "<name>", "color": "mono" }` only if the icon really is single-color.

## Not in v0.1

Several sprites, inline sprite output, a Vite recipe. Status, flags and the output contract: https://github.com/jmlweb/svgworm/blob/main/llms.txt
