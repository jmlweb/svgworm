---
title: Svelte and SvelteKit setup
description: Set up svgworm in a Svelte 5 or SvelteKit app. A generated Icon.svelte renders type-checked icons from a hashed sprite, with no runtime dependency.
order: 5
---

Set svgworm up in a Svelte or SvelteKit app in three steps. The `Icon` component is a plain `.svelte` file that `init` writes into your project. It needs no extra package, and it renders the same markup as the React `Icon`. With server rendering, **icons show before any JavaScript runs**.

Requires Node `^22.20 || >=24.11` and Svelte 5 (runes).

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm && pnpm svgworm init
   # npm:  npm install -D svgworm && npx svgworm init
   # yarn: yarn add -D svgworm && yarn svgworm init
   ```

   `init` sees the `svelte` or `@sveltejs/kit` dependency and does the setup for you:

   - **Files:** writes `svgworm.config.json`, the `predev`/`prebuild` scripts and the component. Then it builds once.
   - **SvelteKit:** the component goes to `src/lib/components/Icon.svelte`. The sprites go to `static/icons/`, because SvelteKit serves `static/`, not `public/`.
   - **Svelte with Vite:** the component goes to `src/components/Icon.svelte`, and the sprites go to `public/icons/`.
   - **Sample icon:** if `icons/` is missing or empty, it adds `icons/svgworm.svg` so the first build works.
   - **Flags:** with `--yes` it asks nothing. Use `--framework svelte` when the project has no `svelte` dependency yet.

   See the [CLI reference](/docs/cli/#init) for every flag.

2. **Put your SVG files in `icons/` (delete the sample) and build:**

   ```bash
   pnpm svgworm
   ```

   This writes the sprite to the static folder and the manifest and types to `svgworm/`. While you work, run `svgworm watch` next to the dev server to **rebuild on each change**.

3. **Use it in any component:**

   ```svelte
   <script lang="ts">
     import Icon from '$lib/components/Icon.svelte';
   </script>

   <nav>
     <Icon name="home" />
     <Icon name="brand/sunset" width={32} height={32} />
     <Icon name="home" title="Go home" class="nav-icon" />
   </nav>
   ```

   - **Names come from the file paths:** `home` is `icons/home.svg` and `brand/sunset` is `icons/brand/sunset.svg`, lower-cased with `-` between words.
   - **Type-checked:** `name` is typed from the generated `IconName`, so a typo fails `svelte-check`.
   - **Decorative by default:** the icon is `aria-hidden` unless you pass `title` or `label`.
   - **Attributes pass through:** `class`, `style` (a string), `id`, `data-*` and `aria-*` land on the rendered element.

`Icon.svelte` is your file, and **`init` never overwrites it**. To refresh it after upgrading svgworm, delete it and run `svgworm init` again.

## Set up by hand

Without `init`, run the CLI before `dev` and `build` yourself:

```json
{ "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
```

**Yarn 2+ never runs `pre` scripts.** With it, put the command in front of the scripts instead, for example `"dev": "svgworm && vite dev"`. For SvelteKit, set `"outDir": "static/icons"` and `"publicPath": "/icons"` in `svgworm.config.json`.

With Vite, the optional `svgworm/vite` plugin can rebuild icons inside `vite dev`. It does not depend on React. See [the plugin section of the Vite setup](/docs/vite/#rebuild-in-vite-dev-optional-plugin).

## base

<aside class="alert alert-important">

<p class="alert-title">Important</p>

SvelteKit's `paths.base` and Vite's `base` move the static folder under that path, but the manifest keeps the URLs svgworm wrote. With a base of `/docs`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `svelte.config.*` or `vite.config.*`.

</aside>

## Content-Security-Policy

Svelte's server renderer adds `onload` and `onerror` attributes to an `<img>` with spread attributes, to replay those events on hydration. That touches icons with the `img` delivery (multicolor icons with gradients, masks, clip paths or filters). They are inline event handlers, so a strict `script-src` without `'unsafe-inline'` blocks them and reports a violation. **The image still loads.** The other deliveries have no such attributes.

## Sprites on a CDN

`init --cdn-url` is **not supported for Svelte yet**: crossOrigin `"inject"` needs a loader `<script>` in the page, and `init` does not write one for Svelte ([ADR-0034](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0034-vue-and-svelte-support-through-init-generated-components.md)). `Icon.svelte` already renders the in-page references that mode needs. Until it is, serve the sprites from your own origin.

## Cache for a year

The file names are content-hashed, so **a long cache is safe**. Send `Cache-Control: public, max-age=31536000, immutable` for `/icons/*` from your host, as in the [Astro setup](/docs/astro/#cache-for-a-year).

## What to commit and CI

Commit the sprite folder (`static/icons/` or `public/icons/`) and `svgworm/`, and run `svgworm check` in CI, before the build. It fails when someone changed an icon and forgot to rebuild. Or ignore both folders and rely on the `predev` and `prebuild` scripts: then anything that type-checks before the build must run `svgworm` first.

```bash
pnpm svgworm check
pnpm build
```

## How it is checked

A conformance test compiles the generated `Icon.svelte` for the server and checks that it renders the same markup as the React `Icon` from the same manifest, for every delivery. `svelte-check` checks that an unknown name is a type error.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Vue? Read the [Vue setup](/docs/vue/).
