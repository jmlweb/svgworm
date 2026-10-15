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

Requires Node `^22.20 || >=24.11`. The [working example](#working-example) uses Vite 8.

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
   pnpm svgworm --source icons
   ```

   Without a config file, pass `--source` on every run, or create `svgworm.config.json` (see [Config](/docs/config/)).

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
       "predev": "svgworm --source icons",
       "prebuild": "svgworm --source icons"
     }
   }
   ```

   **Yarn 2+ never runs `pre` scripts.** With it, put the command in front of the scripts instead: `"dev": "svgworm --source icons && vite"` and `"build": "svgworm --source icons && vite build"`.

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

Vite does not add `base` to the sprite URLs svgworm writes. With `base: '/app/'`, set `--public-path /app/icons` (or `"publicPath": "/app/icons"` in `svgworm.config.json`). `init` does not read `vite.config.*`.

</aside>

Why: Vite copies `public/icons/` to `dist/icons/`, and your host serves `dist/` under `/app/`. So the sprite lives at `/app/icons/…`. Without `publicPath`, the manifest still points at `/icons/…` and **every icon 404s**. `outDir` stays `public/icons`. Only the URL changes, not where the file is written.

```json
{
  "scripts": {
    "prebuild": "svgworm --public-path /app/icons",
    "build": "vite build --base /app/"
  }
}
```

An absolute `base` (`https://cdn.example.com/app/`) serves `public/` from that origin, so the sprite is cross-origin. You have two options:

- **Proxy:** proxy `/icons/*` through the page's origin to keep zero JS.
- **Loader:** build with `--cross-origin inject --public-path https://cdn.example.com/app/icons` and render the loader ([Sprites on a CDN](/docs/config/#sprites-on-a-cdn)).

If the base differs per environment, **keep it in one place** and pass it to both. The example's `check:base` script builds with `base: '/app/'` and checks that the bundle, the manifest and `dist/icons/` agree.

## What to commit

Two choices. **Pick one and stick with it:**

- **Commit `public/icons/` and `svgworm/`** and run `svgworm check` in CI. Every checkout type-checks without a build step. Reviews show icon changes as diffs of the sprite and the manifest. CI fails when someone edits an icon and forgets to rebuild.
- **Ignore both folders** (`public/icons/` and `svgworm/` in `.gitignore`) and rely on the `predev` and `prebuild` scripts. Less noise in reviews. But anything that runs before `vite build`, such as `tsc` or ESLint in CI, must run `svgworm` first. Otherwise it will not find `svgworm/icons.d.ts`.

## CI

Run `svgworm check` before the build. It compiles the icons and compares the result with the committed output. **CI fails (exit 1) when someone changed an icon and forgot to rebuild:**

```bash
pnpm svgworm check
pnpm build
```

## Working example

[examples/vite-react](https://github.com/jmlweb/svgworm/tree/main/examples/vite-react) is a complete Vite 8 and React app with these steps. CI runs `svgworm check` and builds it. Then it checks three things:

- **Bundle:** it references the hashed sprite from the manifest.
- **Sprite:** it is in `dist/icons/`.
- **Output:** `dist/icons/` holds only the manifest's files.

A second build under `base: '/app/'` runs the same checks.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Next.js? Read the [Next.js setup](/docs/nextjs/). Using Astro? Read the [Astro setup](/docs/astro/).
