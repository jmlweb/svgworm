---
title: Vue and Nuxt setup
description: Set up svgworm in a Vue 3.5 or Nuxt app. A generated Icon.vue renders type-checked icons from a hashed sprite, with no runtime dependency.
order: 4
---

Set svgworm up in a Vue or Nuxt app in three steps. The `Icon` component is a plain `.vue` file that `init` writes into your project. It needs no extra package, and it renders the same markup as the React `Icon`. With server rendering, **icons show before any JavaScript runs**.

Requires Node `^22.20 || >=24.11` and Vue 3.5 (Nuxt 4 runs on it).

## Steps

1. **Install and set up:**

   ```bash
   pnpm add -D svgworm && pnpm svgworm init
   # npm:  npm install -D svgworm && npx svgworm init
   # yarn: yarn add -D svgworm && yarn svgworm init
   ```

   `init` sees the `vue` or `nuxt` dependency and does the setup for you:

   - **Files:** writes `svgworm.config.json`, the `predev`/`prebuild` scripts and the component. Then it builds once.
   - **Where the component goes:**
     - Nuxt 4: `app/components/Icon.vue`.
     - Nuxt 3, or Nuxt 4 that keeps the Nuxt 3 layout (no `app/` folder, or `app.vue` at the root): `components/Icon.vue`.
     - With `@nuxt/icon` or Nuxt UI, the file is `SvgIcon.vue` instead, rendered as `<SvgIcon>`, because those modules already register `<Icon>`.
     - Otherwise: `src/components/Icon.vue`.
   - **Sample icon:** if `icons/` is missing or empty, it adds `icons/svgworm.svg` so the first build works.
   - **Flags:** with `--yes` it asks nothing. Use `--framework vue` when the project has no `vue` dependency yet.

   See the [CLI reference](/docs/cli/#init) for every flag.

2. **Put your SVG files in `icons/` (delete the sample) and build:**

   ```bash
   pnpm svgworm
   ```

   This writes the sprite to `public/icons/` and the manifest and types to `svgworm/`. Vite and Nuxt serve `public/` as is. While you work, run `svgworm watch` next to the dev server to **rebuild on each change**.

3. **Use it in any component:**

   ```vue
   <script setup lang="ts">
   // Nuxt auto-imports it: skip this line there.
   import Icon from "../components/Icon.vue";
   </script>

   <template>
     <nav>
       <Icon name="home" />
       <Icon name="brand/sunset" :width="32" :height="32" />
       <Icon name="home" title="Go home" class="nav-icon" />
     </nav>
   </template>
   ```

   - **Names come from the file paths:** `home` is `icons/home.svg` and `brand/sunset` is `icons/brand/sunset.svg`, lower-cased with `-` between words.
   - **Type-checked:** `name` is typed from the generated `IconName`, so a typo fails `vue-tsc` (and `nuxi typecheck`).
   - **Decorative by default:** the icon is `aria-hidden` unless you pass `title` or `label`.
   - **Attributes pass through:** `class`, `style` (a string, an object or an array, as in any Vue template), `id`, `data-*` and `aria-*` land on the rendered element.

**`@nuxt/icon` (and Nuxt UI, which uses it) registers a global `<Icon>`.** When either is a dependency, `init` names the file `SvgIcon.vue`, which Nuxt auto-imports as `<SvgIcon>`. If you add the module later, rename one of the two: its `icon.componentName` option (for example `NuxtIcon`), or your file.

`Icon.vue` is your file, and **`init` never overwrites it**. To refresh it after upgrading svgworm, delete it and run `svgworm init` again.

## Set up by hand

Without `init`, run the CLI before `dev` and `build` yourself:

```json
{ "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
```

**Yarn 2+ never runs `pre` scripts.** With it, put the command in front of the scripts instead, for example `"dev": "svgworm && nuxt dev"`. Then copy the component from `svgworm init --framework vue` in a scratch folder.

With Vite, the optional `svgworm/vite` plugin can rebuild icons inside `vite dev`. It does not depend on React. See [the plugin section of the Vite setup](/docs/vite/#rebuild-in-vite-dev-optional-plugin).

## base

<aside class="alert alert-important">

<p class="alert-title">Important</p>

Vite's `base` and Nuxt's `app.baseURL` move `public/` under that path, but the manifest keeps the URLs svgworm wrote. With a base of `/docs/`, set `--public-path /docs/icons` (or `"publicPath": "/docs/icons"` in `svgworm.config.json`). `init` does not read `vite.config.*` or `nuxt.config.*`.

</aside>

## Sprites on a CDN

Serving the sprites from your own origin needs no JavaScript, so prefer it. To serve them from another origin anyway, see [Sprites on a CDN](/docs/config/#sprites-on-a-cdn).

`svgworm init --cdn-url <https-url>` also writes `SvgwormLoader.vue` next to `Icon.vue`. **Render `<SvgwormLoader />` once, in the root component** (`App.vue`, or `app.vue` in Nuxt). It renders the loader `<script>` with its `integrity`, through a render function, because Vue templates refuse `<script>` tags. It works with server rendering and in a client-only app, in Nuxt with and without `ssr` ([ADR-0036](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0036-vue-and-svelte-cdn-loader-through-init-generated-components.md)).

## Cache for a year

The file names are content-hashed, so **a long cache is safe**. Send `Cache-Control: public, max-age=31536000, immutable` for `/icons/*` from your host, as in the [Astro setup](/docs/astro/#cache-for-a-year).

## What to commit and CI

Commit `public/icons/` and `svgworm/` and run `svgworm check` in CI, before the build. It fails when someone changed an icon and forgot to rebuild. Or ignore both folders and rely on the `predev` and `prebuild` scripts: then anything that type-checks before the build must run `svgworm` first.

```bash
pnpm svgworm check
pnpm build
```

## How it is checked

A conformance test compiles the generated `Icon.vue` for the server and checks that it renders the same markup as the React `Icon` from the same manifest, for every delivery. `vue-tsc` checks that an unknown name is a type error.

## Next steps

- [Icon component](/docs/icon/): every prop, the markup per delivery, sizing and coloring with CSS.
- [How it works](/docs/how-it-works/): the sprite, the stack, delivery forms, the manifest and determinism.
- [CLI reference](/docs/cli/): every command, flag and exit code.
- [Troubleshooting](/docs/troubleshooting/): blank icons, 404s, wrong colors, collisions, `check` in CI.
- Using Svelte? Read the [Svelte setup](/docs/svelte/).
