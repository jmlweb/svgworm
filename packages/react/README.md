<img alt="svgworm" src="https://raw.githubusercontent.com/jmlweb/svgworm/main/docs/assets/logo.svg" width="200">

# @svgworm/react

**React Server Component `Icon` for [svgworm](https://github.com/jmlweb/svgworm) sprites.** No hooks, no `'use client'`, zero client JavaScript, icon names checked at compile time.

```tsx
import { createIcon } from '@svgworm/react';

import { manifest } from '../svgworm/icons.js';

export const Icon = createIcon(manifest);

// <Icon name="home" /> or <Icon name="home" title="Go home" width={32} height={32} />
```

- `name` is checked against the manifest: `home` is `icons/home.svg`, `brand/sunset` is `icons/brand/sunset.svg`. A wrong name is a type error.
- The icon is `aria-hidden` unless you pass `title` or `label`.
- Size, `className` and `style` are standard props.
- Peer dependency: `react` ^19.

```bash
pnpm add -D svgworm && pnpm add @svgworm/react   # npm install -D svgworm && npm install @svgworm/react
```

## Client components

`Icon` has no hooks and no `'use client'`. In Next.js, import it from Server Components only: a `'use client'` file that imports it pulls the whole manifest (`svgworm/icons.js`) into the client chunk, about 200 bytes per icon. Render the icon on the server and pass it to the client component as a prop or as children instead. The [Next.js guide](https://svgworm.com/docs/nextjs/#client-components) shows the pattern.

## Client-only apps and Vite

In a client-only React app (Vite, Create React App) there is no server, so the manifest ships in the bundle: one module with every icon's id, viewBox and delivery, about 200 bytes per icon before compression. The icons themselves still come from the hashed sprite and are not JavaScript. Keep the source folder to the icons you use.

Vite setup, step by step, with `base` and cache headers: the [Vite guide](https://svgworm.com/docs/vite/). In short: run `svgworm` before `vite` (`"predev": "svgworm"`, `"prebuild": "svgworm"`), import the manifest from `svgworm/icons.js`, and create the component as above. Vite serves `public/` at `base`, so with `base: '/app/'` set `--public-path /app/icons` (or `"publicPath": "/app/icons"` in `svgworm.config.json`); without it the manifest points at `/icons/…` and every icon 404s. `svgworm init` detects React but not Vite, so it writes `components/icon.tsx` and the scripts, and you set `publicPath` yourself.

## Sprites on a CDN

With `"crossOrigin": "inject"` in `svgworm.config.json` the sprite lives on another origin, and a small loader puts it in the page (opt-in, icons need JS; [Sprites on a CDN](https://svgworm.com/docs/config/#sprites-on-a-cdn)). `Icon` then renders `<use href="#id">`. Render the loader once in the root layout:

```tsx
import { createSpriteLoader } from '@svgworm/react';

export const SpriteLoader = createSpriteLoader(manifest);
// app/layout.tsx: <html><body><SpriteLoader />{children}</body></html>
```

It renders nothing for a same-origin manifest, and React keeps one tag however many times it is rendered.

## Docs

- [Get started](https://github.com/jmlweb/svgworm#get-started)
- [Next.js setup, caching and `basePath`](https://svgworm.com/docs/nextjs/)
- [Vite setup, caching and `base`](https://svgworm.com/docs/vite/)

> **Status:** 0.x, versioned together with `svgworm`. The props can still change in a minor version before 1.0; see the [changelog](https://github.com/jmlweb/svgworm/blob/main/packages/react/CHANGELOG.md).
