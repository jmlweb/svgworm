---
title: Astro setup
description: Set up svgworm in an Astro 7 site. A generated Icon.astro renders type-checked icons from a hashed sprite, with no React and no client JS.
order: 2
---

Set svgworm up in an Astro site in three steps. Icons render at build time, so a static site ships no JavaScript for them. You need no React and no `@astrojs/react`: the `Icon` component is a plain `.astro` file that `init` writes into your project.

Requires Node `^22.20 || >=24.11` and Astro 7.

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm && pnpm svgworm init
   # npm:  npm install -D svgworm && npx svgworm init
   # yarn: yarn add -D svgworm && yarn svgworm init
   ```

   `init` sees the `astro` dependency and writes `svgworm.config.json`, the `predev`/`prebuild` scripts and `src/components/Icon.astro`, then builds once. If `icons/` is missing or empty, it adds a sample `icons/svgworm.svg` so the first build works. With `--yes` it asks nothing. Use `--framework astro` when the project has no `astro` dependency yet. See the [CLI reference](/docs/cli/#init) for every flag.

2. **Put your SVG files in `icons/` (delete the sample) and build:**

   ```bash
   pnpm svgworm
   ```

   This writes the sprite to `public/icons/` and the manifest and types to `svgworm/`, the same files as in every other setup. Astro serves `public/` as is. While you work, run `svgworm watch` next to `astro dev` to rebuild on each change.

3. **Use it in any `.astro` file:**

   ```astro
   ---
   import Icon from '../components/Icon.astro';
   ---

   <nav>
     <Icon name="home" />
     <Icon name="brand/sunset" width={32} height={32} />
     <Icon name="home" title="Go home" />
   </nav>
   ```

   Names come from the file paths: `home` is `icons/home.svg` and `brand/sunset` is `icons/brand/sunset.svg`, lower-cased with `-` between words. `name` is typed from the generated `IconName`, so a typo fails `astro check`. The icon is `aria-hidden` unless you pass `title` or `label`.

For `astro check` to run at all, the project needs `@astrojs/check` and `typescript` as dev dependencies (`pnpm add -D @astrojs/check typescript`). As of Astro 7.3, `astro check` supports TypeScript 6 only: with TypeScript 7 it stops with `astro check does not currently support TypeScript 7.0`. Pin `typescript@6` until Astro adds support. The generated types themselves work with both.

`Icon.astro` is your file. `init` never overwrites it. To refresh it after upgrading svgworm, delete it and run `svgworm init` again.

## Set up by hand

Without `init`, run the CLI before `dev` and `build` yourself:

```json
{ "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
```

Yarn 2+ never runs `pre` scripts. With it, put the command in front of the scripts instead: `"dev": "svgworm && astro dev"` and `"build": "svgworm && astro build"`.

## Cache for a year

The file names are content-hashed, so a long cache is safe. Astro does not set cache headers; your host does.

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
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  }
  ```

## Performance notes

- **One sprite, every page.** All icons live in one sprite, so the first visit downloads the whole set once, then the long cache serves every other page from disk. That is fine at tens of KiB (this site's sprite is 10.7 KiB for 21 icons, about 0.5 KiB per optimized icon). With a thousand icons the sprite is the biggest asset on the page, and only the icons you use belong in the source folder. The full Lucide set (1,866 icons) is 539 KiB, 75 KiB gzipped. To split a large set by area, build [one sprite per config](/docs/config/#several-sprites).
- **The stack file is one fetch per cold load** when it is served with the `immutable` header above, in Chromium, Firefox and WebKit. WebKit fetches it twice only when a mask icon asks for it while the fetch for an `<img>` icon is still in flight. Earlier notes of 2 to 3 requests were mostly cache hits ([ADR-0019](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0019-sprite-preload-not-recommended.md), measured in [TSK-039](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-039-sprite-preload/results/matrix.md)).
- **Do not add `<link rel="preload">` for the sprite.** A `<use>` fetch is `same-origin`, and no preload has that mode, so the hint never feeds it from the preload cache. With the preload still in flight, Playwright WebKit 26 downloads the sprite twice (real Safari not checked), and without a long cache every engine does. Chromium and WebKit start the `<use>` fetch at parse time anyway. Details and the browser matrix: [ADR-0019](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0019-sprite-preload-not-recommended.md), [TSK-039 matrix](https://github.com/jmlweb/svgworm/blob/main/spikes/TSK-039-sprite-preload/results/matrix.md). `Icon.astro` emits no preload either.

## base

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Astro does not add `base` to the sprite URLs svgworm writes. With `base: '/docs'`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `astro.config.*`.

</aside>

Why: Astro copies `public/icons/` to the root of `dist/`, and your host serves `dist/` under `/docs/`, so the sprite lives at `/docs/icons/…`. Without `publicPath`, the manifest still points at `/icons/…` and every icon 404s. We checked this with a build of this site under `base: '/docs'`.

## Sprites on a CDN

`build.assetsPrefix` does not move `public/`, so the sprite stays on your origin. To serve it from another origin anyway, see [Sprites on a CDN](/docs/config/#sprites-on-a-cdn): `svgworm init --cdn-url <https-url>` also writes `SvgwormLoader.astro`; render `<SvgwormLoader />` once in your layout's `<head>`. With the `<ClientRouter />`, the loader puts the sprite back after each page swap.

## What to commit

Two choices. Pick one and stick with it:

- **Commit `public/icons/` and `svgworm/`** and run `svgworm check` in CI. Every checkout passes `astro check` without a build step, reviews show icon changes as diffs, and CI fails when someone edits an icon and forgets to rebuild.
- **Ignore both folders** (`public/icons/` and `svgworm/` in `.gitignore`) and rely on the `predev` and `prebuild` scripts. Less noise in reviews, but anything that runs before `astro build`, such as `astro check` in CI, must run `svgworm` first or it will not find `svgworm/icons.d.ts`.

## CI

Run `svgworm check` before the build. It compiles the icons and compares the result with the committed output, so CI fails when someone changed an icon and forgot to rebuild:

```bash
pnpm svgworm check
pnpm astro build
```

## Working example

This website is an Astro 7 static site that renders every icon through the generated `Icon.astro` ([source](https://github.com/jmlweb/svgworm/tree/main/apps/site)). CI checks that every icon comes from the hashed sprite, and a test checks that `Icon.astro` and the React `Icon` render the same markup from the same manifest.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Next.js? Read the [Next.js setup](/docs/nextjs/). Using Vite? Read the [Vite setup](/docs/vite/).
