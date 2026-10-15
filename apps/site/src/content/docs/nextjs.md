---
title: Next.js App Router setup
description: Set up svgworm in a Next.js App Router app. A hashed sprite from your SVG folder and type-checked icons in Server Components, with zero client JS.
order: 1
---

Set svgworm up in a Next.js App Router app in three steps. You end up with a hashed sprite in `public/icons/`, typed icon names, and an `Icon` component that runs only on the server.

Requires Node `^22.20 || >=24.11`.

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm && pnpm add @svgworm/react && pnpm svgworm init
   # npm:  npm install -D svgworm && npm install @svgworm/react && npx svgworm init
   # yarn: yarn add -D svgworm && yarn add @svgworm/react && yarn svgworm init
   ```

   `init` writes `svgworm.config.json`, adds `predev` and `prebuild` scripts that run `svgworm`, and creates `components/icon.tsx` (`src/components/icon.tsx` when `src/` exists). If `icons/` is missing or empty, it adds a sample `icons/svgworm.svg`, then it builds once so the app runs and type-checks right away. With `--yes` it asks nothing. It never overwrites a file that differs, so re-running it is safe. See the [CLI reference](/docs/cli/#init) for every flag.

2. **Put your SVG files in `icons/` (delete the sample) and build:**

   ```bash
   pnpm svgworm
   ```

   `pnpm dev` and `pnpm build` run it too, through the `predev` and `prebuild` scripts. It writes the sprite to `public/icons/` and the manifest and types to `svgworm/`:

   | File | Contents |
   | --- | --- |
   | `public/icons/icons.<hash>.svg` | Sprite (plus `icons.stack.<hash>.svg` when an icon needs it) |
   | `svgworm/icons.js` | Manifest (data only) |
   | `svgworm/icons.d.ts` | Types: `IconName` and the manifest shape |
   | `svgworm/manifest.json` | Same manifest, for scripts and templates |

3. **Use it anywhere on the server:**

   ```tsx
   import { Icon } from "@/components/icon";

   export const Nav = () => (
     <nav>
       <Icon name="home" />
       <Icon name="brand/sunset" width={32} height={32} />
       <Icon name="home" title="Go home" />
     </nav>
   );
   ```

   Names come from the file paths: `home` is `icons/home.svg` and `brand/sunset` is `icons/brand/sunset.svg`, lower-cased with `-` between words. The icon is `aria-hidden` unless you pass `title` or `label`. An unknown `name` is a type error, so an editor lists every valid name.

## Client components

`Icon` runs on the server: it reads the manifest and renders markup, with no hooks and no client JavaScript. Import it only from Server Components. A file with `'use client'` that imports `Icon` pulls the whole manifest (`svgworm/icons.js`, every icon's id, viewBox and delivery) into that client chunk: about 200 bytes per icon before compression, so a 1,500-icon set adds roughly 300 KB of JavaScript that the sprite was meant to avoid. The zero-client-JS check in the [example](https://github.com/jmlweb/svgworm/tree/main/examples/next-app-router) catches this.

When a client component needs an icon, render it in the Server Component and pass the result down:

```tsx
// app/page.tsx (server)
import { Icon } from "@/components/icon";
import { MenuButton } from "@/components/menu-button";

export default function Page() {
  return <MenuButton icon={<Icon name="menu" />} />;
}
```

```tsx
// components/menu-button.tsx
"use client";

import type { ReactNode } from "react";

export const MenuButton = ({ icon }: { icon: ReactNode }) => (
  <button onClick={() => {}}>{icon} Menu</button>
);
```

The client component receives rendered markup, not the manifest. In a client-only app (Vite, Create React App) there is no server to keep the manifest on, so it ships in the bundle; see the [Vite setup](/docs/vite/) for the trade-off.

## Set up by hand

Without `init`, do its part yourself after installing the two packages:

1. **Build the sprite** from your icon folder:

   ```bash
   pnpm svgworm --source icons
   ```

   Without a config file, pass `--source` on every run, or create `svgworm.config.json` (see [Config](/docs/config/)).

2. **Create the component once, in a Server Component file:**

   ```tsx
   // components/icon.tsx
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

   Yarn 2+ never runs `pre` scripts. With it, put the command in front of the scripts instead: `"dev": "svgworm --source icons && next dev"` and `"build": "svgworm --source icons && next build"`.

## Cache for a year

Next serves `public/` with `max-age=0`. The file names are content-hashed, so a long cache is safe:

```ts
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: "/icons/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};
```

## Performance notes

- **One sprite, every page.** All icons live in one sprite, so the first visit downloads the whole set once, then the long cache serves every other page from disk. That is fine at tens of KiB (this site's sprite is 10.7 KiB for 21 icons, about 0.5 KiB per optimized icon). With a thousand icons the sprite is the biggest asset on the page, and only the icons you use belong in the source folder. The full Lucide set (1,866 icons) is 539 KiB, 75 KiB gzipped. To split a large set by area, build [one sprite per config](/docs/config/#several-sprites).
- **The stack file is one fetch per cold load** when it is served with the `immutable` header above, in Chromium, Firefox and WebKit. WebKit fetches it twice only when a mask icon asks for it while the fetch for an `<img>` icon is still in flight. Earlier notes of 2 to 3 requests were mostly cache hits ([ADR-0019](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0019-sprite-preload-not-recommended.md), measured in [TSK-039](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-039-sprite-preload/results/matrix.md)).
- **Do not add `<link rel="preload">` for the sprite.** A `<use>` fetch is `same-origin`, and no preload has that mode, so the hint never feeds it from the preload cache. With the preload still in flight, Playwright WebKit 26 downloads the sprite twice (real Safari not checked), and without a long cache every engine does. Chromium and WebKit start the `<use>` fetch at parse time anyway. Details and the browser matrix: [ADR-0019](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0019-sprite-preload-not-recommended.md), [TSK-039 matrix](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-039-sprite-preload/results/matrix.md). React 19's own `preload` for `<img>` icons is fine and stays.

## basePath

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Next does not add `basePath` to the sprite URLs svgworm writes. With a `basePath` of `/docs`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `next.config.*`.

</aside>

Next serves `public/` under the `basePath`, so the sprite lives at `/docs/icons/…`. Without `publicPath`, the manifest still points at `/icons/…` and every icon 404s.

## Sprites on a CDN

`assetPrefix` does not move `public/`, so the sprite stays on your origin and needs nothing else. To serve it from another origin anyway, see [Sprites on a CDN](/docs/config/#sprites-on-a-cdn): `svgworm init --cdn-url <https-url>` adds `export const SpriteLoader = createSpriteLoader(manifest)` to the component file; render `<SpriteLoader />` once in `app/layout.tsx`.

## What to commit

Two choices. Pick one and stick with it:

- **Commit `public/icons/` and `svgworm/`** and run `svgworm check` in CI. Every checkout type-checks without a build step, reviews show icon changes as diffs of the sprite and the manifest, and CI fails when someone edits an icon and forgets to rebuild.
- **Ignore both folders** (`public/icons/` and `svgworm/` in `.gitignore`) and rely on the `predev` and `prebuild` scripts. Less noise in reviews, but anything that runs before `next build`, such as `tsc` or ESLint in CI, must run `svgworm` first or it will not find `svgworm/icons.d.ts`.

## CI

Run `svgworm check` before the build. It compiles the icons and compares the result with the committed output, so CI fails (exit 1) when someone changed an icon and forgot to rebuild:

```bash
pnpm svgworm check
pnpm next build
```

## Working example

[examples/next-app-router](https://github.com/jmlweb/svgworm/tree/main/examples/next-app-router) is a complete app with these steps. CI builds it with Turbopack and checks that no icon code ends up in client chunks.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Astro? Read the [Astro setup](/docs/astro/). Using Vite? Read the [Vite setup](/docs/vite/).
