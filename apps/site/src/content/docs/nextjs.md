---
title: Next.js App Router setup
description: Set up svgworm in a Next.js App Router app. Build a hashed sprite from your SVG folder and render type-checked icons in Server Components with zero client JavaScript.
order: 1
---

Set svgworm up in a Next.js App Router app in three steps. You end up with a hashed sprite in `public/icons/`, typed icon names, and an `Icon` component that runs only on the server.

Requires Node `^22.20 || >=24.11`.

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm
   pnpm add @svgworm/react
   pnpm svgworm init
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

   The icon is `aria-hidden` unless you pass `title` or `label`. An unknown `name` is a type error.

In CI, `pnpm svgworm check` exits 1 when the committed output is stale.

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
        ],
      },
    ];
  },
};
```

## basePath

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Next does not add `basePath` to a raw `href`. With a `basePath` of `/docs`, set `--public-path /docs/icons`.

</aside>

## Working example

[examples/next-app-router](https://github.com/jmlweb/svgworm/tree/main/examples/next-app-router) is a complete app with these steps, built with Turbopack and checked in CI for no icon code in client chunks.

## Next

- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- Using Astro? Read the [Astro setup](/docs/astro/).
