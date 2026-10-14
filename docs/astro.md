# Astro setup

> [!TIP]
> `svgworm init` does steps 2 to 4 for you. This page shows what it sets up, plus the parts it cannot do.

Requires Node `^22.20 || >=24.11` and Astro 7. Icons render at build time, so a static site ships no JavaScript for them. There is no React and no `@astrojs/react`; the component is a plain `.astro` file that `init` generates in your project ([ADR-0017](adr/0017-astro-support-via-generated-icon-astro.md)).

## Steps

1. **Put your SVG files in `icons/`.**

2. **Install and set up:**

   ```bash
   pnpm add -D svgworm
   pnpm svgworm init
   ```

   `init` sees the `astro` dependency and writes `svgworm.config.json`, the `predev`/`prebuild` scripts and `src/components/Icon.astro`. With `--yes` it asks nothing. Use `--framework astro` when the project has no `astro` dependency yet.

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

| Host                     | File                  | Rule                                                                                      |
| ------------------------ | --------------------- | ----------------------------------------------------------------------------------------- |
| Cloudflare, Netlify      | `public/_headers`     | `/icons/*` then `  Cache-Control: public, max-age=31536000, immutable`                    |
| Vercel                   | `vercel.json`         | `{ "headers": [{ "source": "/icons/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }` |

## base

> [!IMPORTANT]
> Astro does not add `base` to the sprite URLs svgworm writes. With `base: '/docs'`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `astro.config.*`.

This was checked with a build of the [project site](../apps/site) with `base: '/docs'`: `public/icons/` lands in the `dist/` root and `/icons/…` URLs are left unchanged, so they only work when the host serves `dist/` under `/docs/`.

## CI

Run `svgworm check` before the build. It compares the committed output with a fresh compile, so it catches a forgotten rebuild only on files as committed:

```bash
pnpm svgworm check
pnpm astro build
```

## Working example

The [project site](../apps/site) is an Astro 7 static site that renders every icon through the generated `Icon.astro`. CI checks it for zero client JS, and a test renders `Icon.astro` and `createIcon` from the same manifest and compares the markup.
