---
title: Next.js App Router setup
description: Set up svgworm in a Next.js App Router app. Build a hashed sprite from your SVG folder and render type-checked icons in Server Components with zero client JavaScript.
order: 1
---

Set svgworm up in a Next.js App Router app in five steps. You end up with a hashed sprite in `public/icons/`, typed icon names, and an `Icon` component that runs only on the server.

<aside class="alert alert-tip">

<p class="alert-title">Tip</p>

`svgworm init` does steps 2 to 4 for you. This page shows what it sets up, plus the parts it cannot do. See the [CLI reference](/docs/cli/#init).

</aside>

Requires Node `^22.20 || >=24.11`.

## Steps

1. **Put your SVG files in `icons/`.**

2. **Install and build the sprite:**

   ```bash
   pnpm add -D svgworm
   pnpm add @svgworm/react
   pnpm svgworm --source icons
   ```

   This writes the sprite to `public/icons/` and the manifest and types to `svgworm/`:

   ```text
   public/icons/icons.<hash>.svg   sprite (and icons.stack.<hash>.svg when an icon needs it)
   svgworm/icons.js                manifest (data only)
   svgworm/icons.d.ts              types: IconName and the manifest shape
   svgworm/manifest.json           same manifest, for scripts and templates
   ```

3. **Create the component once, in a Server Component file:**

   ```tsx
   // components/icon.tsx
   import { createIcon } from "@svgworm/react";

   import { manifest } from "../svgworm/icons.js";

   export const Icon = createIcon(manifest);
   ```

4. **Run the CLI before `dev` and `build`:**

   ```json
   { "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
   ```

5. **Use it anywhere on the server:**

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
