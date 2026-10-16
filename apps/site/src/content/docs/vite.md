---
title: Vite + React setup
description: Set up svgworm in a Vite and React app. A hashed sprite from your SVG folder and type-checked icons, with the Vite base and cache headers covered.
order: 3
---

Set svgworm up in a Vite and React app in three steps. You end up with:

- a **hashed sprite** in `public/icons/`;
- **typed icon names**;
- an `Icon` component.

Vite serves `public/` as it is and copies it into `dist/`, so **the sprite needs no plugin**.

Requires Node `^22.20 || >=24.11` and React 19 (`@svgworm/react` has `react ^19` as a peer). The [working example](#working-example) uses Vite 8.

A Vite app renders on the client, so `Icon` runs in the browser. The sprite is a separate cached file and is not JavaScript. But the manifest ships in your bundle: every icon's id, viewBox and delivery, about 200 bytes per icon before compression. **Keep the source folder to the icons you use.** For zero client JS, use [Next.js](/docs/nextjs/) Server Components or [Astro](/docs/astro/).

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm && pnpm add @svgworm/react && pnpm svgworm init
   # npm:  npm install -D svgworm && npm install @svgworm/react && npx svgworm init
   # yarn: yarn add -D svgworm && yarn add @svgworm/react && yarn svgworm init
   ```

   `init` does the setup for you:

   - **Config:** writes `svgworm.config.json`.
   - **Scripts:** adds `predev` and `prebuild` scripts that run `svgworm`.
   - **Component:** creates `components/icon.tsx` (`src/components/icon.tsx` when `src/` exists).
   - **First build:** if `icons/` is missing or empty, it adds a sample `icons/svgworm.svg`. Then it builds once.

   It does not detect Vite, so it does not read `vite.config.*`. **Set `publicPath` yourself** when you use a [`base`](#base). See the [CLI reference](/docs/cli/#init) for every flag.

2. **Put your SVG files in `icons/` (delete the sample) and build:**

   ```bash
   pnpm svgworm
   ```

   `pnpm dev` and `pnpm build` run it too, through the `predev` and `prebuild` scripts. It writes the sprite to `public/icons/` and the manifest and types to `svgworm/`:

   | File                            | Contents                                                     |
   | ------------------------------- | ------------------------------------------------------------ |
   | `public/icons/icons.<hash>.svg` | Sprite (plus `icons.stack.<hash>.svg` when an icon needs it) |
   | `svgworm/icons.js`              | Manifest (data only)                                         |
   | `svgworm/icons.d.ts`            | Types: `IconName` and the manifest shape                     |
   | `svgworm/manifest.json`         | Same manifest, for scripts and templates                     |

3. **Use it in any component:**

   ```tsx
   import { Icon } from "./components/icon";

   export const Nav = () => (
     <nav>
       <Icon name="home" />
       <Icon name="brand/sunset" width={32} height={32} />
       <Icon name="home" title="Go home" />
     </nav>
   );
   ```

   - **Names come from the file paths:** `home` is `icons/home.svg` and `brand/sunset` is `icons/brand/sunset.svg`, lower-cased with `-` between words.
   - **Decorative by default:** the icon is `aria-hidden` unless you pass `title` or `label`.
   - **Type-checked:** an unknown `name` is a type error, so an editor lists every valid name.
   - **No `'use client'` rule:** every component runs in the browser, so importing `Icon` anywhere is fine.

## Set up by hand

Without `init`, do its part yourself after installing the two packages:

1. **Build the sprite** from your icon folder:

   ```bash
   pnpm svgworm
   ```

   With no config file, svgworm reads the `icons/` folder. For another folder, pass `--source <dir>` on every run, or create `svgworm.config.json` (see [Config](/docs/config/)).

2. **Create the component once:**

   ```tsx
   // src/icon.tsx
   import { createIcon } from "@svgworm/react";

   import { manifest } from "../svgworm/icons.js";

   export const Icon = createIcon(manifest);
   ```

3. **Run the CLI before `dev` and `build`:**

   ```json
   {
     "scripts": {
       "predev": "svgworm",
       "prebuild": "svgworm"
     }
   }
   ```

   **Yarn 2+ never runs `pre` scripts.** With it, put the command in front of the scripts instead: `"dev": "svgworm && vite"` and `"build": "svgworm && vite build"`.

## Rebuild in vite dev (optional plugin)

The `predev` script builds once, so a changed icon needs a restart or a second `svgworm watch` process. The optional `svgworm/vite` plugin runs svgworm inside Vite instead. It needs Vite 8.3 or later and comes with the `svgworm` package, so there is nothing more to install:

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { svgworm } from "svgworm/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), svgworm()],
});
```

Then **remove the `predev` and `prebuild` scripts**, or every build runs twice.

- **`vite dev`:** builds before the server is ready, then rebuilds when an SVG in a source folder changes. The page updates through HMR, with no restart. A broken icon shows in the terminal and in Vite's error overlay; the server keeps running, and fixing the file clears it.
- **`vite build`:** builds once before Vite reads your code. A broken icon or an invalid config fails the build (non-zero exit), and nothing is written.
- **Config:** it reads the same `svgworm.config.json` from Vite's `root`. Pass `svgworm({ configFile: "icons.config.json" })` for another file.
- **`base`:** it stops with an error when Vite has a `base` and `svgworm.config.json` sets no `publicPath`, instead of letting every icon 404. See [base](#base).

The CLI stays the main path. `init` still writes `predev` and `prebuild`, `svgworm check` in CI is unchanged, and the plugin is only one line in `vite.config.ts`. `vite build --watch` builds the icons once; use `vite dev` or `svgworm watch` to rebuild on change.

## Cache for a year

Vite copies `public/` as it is and has no header setting for it. The file names are content-hashed, so **a long cache is safe**, and your host sets it. `vite preview` and the dev server send no long cache.

- **Cloudflare and Netlify**, in `public/_headers`:

  ```text
  /icons/*
    Cache-Control: public, max-age=31536000, immutable
    X-Content-Type-Options: nosniff
  ```

- **Vercel**, in `vercel.json`:

  ```json
  {
    "headers": [
      {
        "source": "/icons/(.*)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  }
  ```

- **Anything else:** give `/icons/*` the same two headers in nginx, Apache, S3 and CloudFront, or your own server. With a `base`, the rule matches `<base>icons/*`.

## base

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Vite does not add `base` to the sprite URLs svgworm writes. With `base: '/app/'`, set `"publicPath": "/app/icons"` in `svgworm.config.json` (or pass `--public-path /app/icons`). `init` does not read `vite.config.*`.

The [plugin](#rebuild-in-vite-dev-optional-plugin) checks this for you. With a `base` and no `publicPath` in the config, `vite dev` and `vite build` stop with:

```text
svgworm: Vite base is "/app/" but svgworm publicPath is "/icons", so every icon would 404
  set "publicPath": "/app/icons" in svgworm.config.json
```

The plugin never adds `base` itself. The CLI does not read `vite.config.*`, so the URL must live in the config, where `svgworm`, `svgworm check` and the plugin all read it.

</aside>

Why: Vite copies `public/icons/` to `dist/icons/`, and your host serves `dist/` under `/app/`. So the sprite lives at `/app/icons/…`. Without `publicPath`, the manifest still points at `/icons/…` and **every icon 404s**. `outDir` stays `public/icons`. Only the URL changes, not where the file is written.

```json
{
  "sources": ["icons"],
  "publicPath": "/app/icons"
}
```

The check covers a root-path `base` only. A relative `base` (`./`) is not checked; a sprite URL must be a root path, so keep `publicPath` a root path too.

An absolute `base` (`https://cdn.example.com/app/`) serves `public/` from that origin, so the sprite is cross-origin. You have two options:

- **Proxy:** proxy `/icons/*` through the page's origin to keep zero JS.
- **Loader:** build with `--cross-origin inject --public-path https://cdn.example.com/app/icons` and render the loader ([Sprites on a CDN](/docs/config/#sprites-on-a-cdn)).

If the base differs per environment, use one svgworm config per environment and pass it to the plugin: `svgworm({ configFile: "svgworm.staging.config.json" })`. Without the plugin, pass `--config` to the CLI. The example's `check:base` script does this: it builds with `vite.base.config.ts` (`base: '/app/'`, its own svgworm config) and checks that the bundle, the manifest and `dist/icons/` agree.

## What to commit

Two choices. **Pick one and stick with it:**

- **Commit `public/icons/` and `svgworm/`** and run `svgworm check` in CI. Every checkout type-checks without a build step. Reviews show icon changes as diffs of the sprite and the manifest. CI fails when someone edits an icon and forgets to rebuild.
- **Ignore both folders** (`public/icons/` and `svgworm/` in `.gitignore`) and rely on the `predev` and `prebuild` scripts, or the plugin. Less noise in reviews. But anything that runs before `vite build`, such as `tsc` or ESLint in CI, must run `svgworm` first. Otherwise it will not find `svgworm/icons.d.ts`. With the plugin, that means `"build": "svgworm && tsc -b && vite build"`.

## CI

Run `svgworm check` before the build. It compiles the icons and compares the result with the committed output. **CI fails (exit 1) when someone changed an icon and forgot to rebuild:**

```bash
pnpm svgworm check
pnpm build
```

## Working example

[examples/vite-react](https://github.com/jmlweb/svgworm/tree/main/examples/vite-react) is a complete Vite 8 and React app with these steps, using the plugin. CI runs `svgworm check` and builds it. Then it checks three things:

- **Bundle:** it references the hashed sprite from the manifest.
- **Sprite:** it is in `dist/icons/`.
- **Output:** `dist/icons/` holds only the manifest's files.

A second build under `base: '/app/'`, with `publicPath` set in its own svgworm config, runs the same checks.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Next.js? Read the [Next.js setup](/docs/nextjs/). Using Astro? Read the [Astro setup](/docs/astro/).
