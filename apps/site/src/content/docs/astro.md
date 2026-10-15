---
title: Astro setup
description: Set up svgworm in an Astro 7 site. A generated Icon.astro renders type-checked icons from a hashed sprite, with no React and no client JavaScript.
order: 2
---

Set svgworm up in an Astro site. Icons render at build time, so a static site ships no JavaScript for them. There is no React and no `@astrojs/react`: the component is a plain `.astro` file that `init` generates in your project ([ADR-0017](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0017-astro-support-via-generated-icon-astro.md)).

<aside class="alert alert-tip">

<p class="alert-title">Tip</p>

`svgworm init` does steps 2 to 4 for you. This page shows what it sets up, plus the parts it cannot do. See the [CLI reference](/docs/cli/#init).

</aside>

Requires Node `^22.20 || >=24.11` and Astro 7.

## Steps

1. **Put your SVG files in `icons/`.**

2. **Install and set up:**

   ```bash
   pnpm add -D svgworm
   pnpm svgworm init
   ```

   `init` sees the `astro` dependency and writes `svgworm.config.json`, the `predev`/`prebuild` scripts and `src/components/Icon.astro`, then builds once. If `icons/` is still empty, it adds a sample `icons/svgworm.svg` so the first build works; delete it once you have your own icons. With `--yes` it asks nothing. Use `--framework astro` when the project has no `astro` dependency yet.

3. **Build the sprite:**

   ```bash
   pnpm svgworm
   ```

   This writes the sprite to `public/icons/` and the manifest and types to `svgworm/`, the same files as in every other setup. Astro serves `public/` as is.

4. **Run the CLI before `dev` and `build`:**

   ```json
   { "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
   ```

   While you work, `svgworm watch` rebuilds on each change, next to `astro dev`.

5. **Use it in any `.astro` file:**

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

   `name` is typed from the generated `IconName`, so a typo fails `astro check`. The icon is `aria-hidden` unless you pass `title` or `label`.

`Icon.astro` is your file. `init` never overwrites it. To refresh it after upgrading svgworm, delete it and run `svgworm init` again.

## Cache for a year

The file names are content-hashed, so a long cache is safe. Astro does not set cache headers; your host does.

| Host                | File              | Rule                                                                                                                                    |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare, Netlify | `public/_headers` | `/icons/*` then `  Cache-Control: public, max-age=31536000, immutable`                                                                  |
| Vercel              | `vercel.json`     | `{ "headers": [{ "source": "/icons/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }` |

## base

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Astro does not add `base` to the sprite URLs svgworm writes. With `base: '/docs'`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `astro.config.*`.

</aside>

This was checked with a build of this site with `base: '/docs'`: `public/icons/` lands in the `dist/` root and `/icons/…` URLs are left unchanged, so they only work when the host serves `dist/` under `/docs/`.

## CI

Run `svgworm check` before the build. It compares the committed output with a fresh compile, so it catches a forgotten rebuild only on files as committed:

```bash
pnpm svgworm check
pnpm astro build
```

## Working example

This website is an Astro 7 static site that renders every icon through the generated `Icon.astro`; its [source](https://github.com/jmlweb/svgworm/tree/main/apps/site) is in the repo. CI checks that every icon comes from the hashed sprite (the site itself may use client JS; only what svgworm generates must not need it), and a test renders `Icon.astro` and `createIcon` from the same manifest and compares the markup.

## Next

- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Config](/docs/config/): `svgworm.config.json` and per-icon color overrides.
- Using Next.js? Read the [Next.js setup](/docs/nextjs/).
