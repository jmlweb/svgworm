# Next.js App Router setup

> [!TIP]
> `svgworm init` does steps 2 to 4 for you. This page shows what it sets up, plus the parts it cannot do.

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
   import { createIcon } from '@svgworm/react';

   import { manifest } from '../svgworm/icons.js';

   export const Icon = createIcon(manifest);
   ```

4. **Run the CLI before `dev` and `build`:**

   ```json
   { "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
   ```

5. **Use it anywhere on the server:**

   ```tsx
   import { Icon } from '@/components/icon';

   export const Nav = () => (
     <nav>
       <Icon name="home" />
       <Icon name="brand/sunset" width={32} height={32} />
       <Icon name="home" title="Go home" />
     </nav>
   );
   ```

   The icon is `aria-hidden` unless you pass `title` or `label`.

## Cache for a year

Next serves `public/` with `max-age=0`. The file names are content-hashed, so a long cache is safe:

```ts
// next.config.ts
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

## basePath

> [!IMPORTANT]
> Next does not add `basePath` to a raw `href`. With a `basePath` of `/docs`, set `--public-path /docs/icons`.

## Working example

[examples/next-app-router](../examples/next-app-router) is a complete app with these steps, built with Turbopack and checked for zero client JS in CI.
