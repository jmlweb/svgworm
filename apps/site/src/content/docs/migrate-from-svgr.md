---
title: Migrate from SVGR
description: 'Move a React, Next.js or Vite app from SVGR to svgworm: one codemod rewrites every import Logo from ''./logo.svg'' into a type-checked <Icon name="logo" />, and lists what it cannot convert.'
order: 12
---

SVGR turns each SVG into a React component, so every icon ships as JavaScript and its path data is repeated in the HTML on every render. svgworm puts the icons into one cacheable sprite and renders `<Icon name="logo" />`. The name is type-checked.

The switch has three steps:

1. Set svgworm up on the folder that already holds your SVGs.
2. Run the codemod. It rewrites the imports and the JSX.
3. Remove the SVGR config once no import is left.

Both can run side by side while you migrate.

## 1. Set svgworm up

Point `init` at the folder with your SVG files:

```bash
npx svgworm init --source src/assets/icons --yes
pnpm add @svgworm/react
```

It writes `svgworm.config.json`, the `predev`/`prebuild` scripts and `components/icon.tsx` (or `src/components/icon.tsx`), then builds once. The [Next.js](/docs/nextjs/) and [Vite](/docs/vite/) pages cover the details.

<aside class="alert alert-note">

<p class="alert-title">Note</p>

If your SVGs live under `public/` (`public/icons`), the sprites cannot be written there too, because the next build would read them as icons. Pass `--out-dir public/sprites`, or move the SVGs out of `public/`. SVGR imports resolve from any folder, so moving them is safe.

</aside>

## 2. Run the codemod

```bash
npx svgworm migrate svgr          # dry run: prints every change, writes nothing
npx svgworm migrate svgr --write  # applies them
```

It reads the same `svgworm.config.json`. It scans every `.js`, `.jsx`, `.ts` and `.tsx` file in the project for `.svg` imports. It skips `node_modules`, dot folders, svgworm's own output, and `dist`, `build`, `out` and `coverage` at the project root. Each import is matched to the icon svgworm builds from that file:

| Before                                                                   | After                                                    |
| ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `import Logo from './logo.svg'` (Next.js, `@svgr/webpack`)               | `import { Icon } from '../components/icon'`              |
| `import { ReactComponent as Logo } from './logo.svg'` (Create React App) | the same                                                 |
| `import Logo from './logo.svg?react'` (`vite-plugin-svgr`)               | the same                                                 |
| `import Logo from '@/icons/logo.svg'` (tsconfig `paths`)                 | the same                                                 |
| `<Logo className="h-6" aria-label="Home" />`                             | `<Icon name="logo" className="h-6" aria-label="Home" />` |
| `<ArrowLeft></ArrowLeft>` (`icons/arrows/left.svg`)                      | `<Icon name="arrows/left" />`                            |

- **Props carry over.** `className`, `style`, `width`, `height`, `aria-*` and `title` carry over. The `Icon` takes the same SVG props, and a wrong one is a type error. Spread props (`{...props}`) carry over too, but TypeScript does not check the keys inside a spread. Check that one does not pass a `ref`, children, `fill` or `stroke`.
- **Imports.** It adds one `Icon` import per file and removes each `.svg` import it fully converted. A URL import (`import logoUrl from './logo.svg'` used as `<img src={logoUrl}>`) is not SVGR, so it stays.
- **Formatting.** It only replaces text, so your formatting is kept. Run your formatter on the changed files afterwards.
- **Re-running.** Running it again is safe. It finds nothing left to convert.

It needs TypeScript 5 or 6 to read your code. A project that already has it needs nothing more. Otherwise run `npx -p typescript@6 -p svgworm svgworm migrate svgr`. TypeScript 7 has no JS compiler API yet.

### What it leaves on SVGR

An import it cannot convert safely is listed with `file:line` and a reason. **That file is not touched**, and the command exits 1, so CI or an agent can tell that the migration is not finished.

```text
skip src/Tooltip.tsx:55 InfoSvg from "./assets/svg/info.svg" is used as a value, not as a JSX tag; rewrite it by hand with <Icon name="info" />
skip src/Search.tsx:67 SearchSvg from "./assets/svg/search.svg" sets fill, which SVGR applies to the inline paths; color a sprite icon with color or CSS (currentColor)
```

| Reason                                                                         | What to do                                                                                                   |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Used as a value (`styled(Logo)`, `icons = { logo: Logo }`, `component={Logo}`) | Rewrite it with the `<Icon name>` the message gives. For `styled(Logo)`, style a wrapper or pass `className` |
| `fill` or `stroke` prop                                                        | Set `color` (or CSS `color`) instead. Single-color icons draw with `currentColor`                            |
| `ref`, children, `titleId`, `desc`                                             | The `Icon` takes none of them. Use `title` or `label` for an accessible name                                 |
| Animated icon (SMIL or `@keyframes` in the file)                               | Keep SVGR for it (see below)                                                                                 |
| Outside the configured sources                                                 | Add its folder to `sources`, or keep SVGR for it                                                             |
| Not a valid icon, or a name collision                                          | Fix the file. `svgworm` prints the same error                                                                |
| The file already declares `Icon` (another import, a type, a prop) | Rename the other `Icon`, then run again                                |
| Re-exported from a barrel (`export { default as Logo } from './logo.svg'`) | Import the icon where it is used, or render `<Icon name>` there instead |

## 3. Remove SVGR

Remove SVGR only after `npx svgworm migrate svgr` exits 0. Until then, the imports it left still need the loader. The codemod does not see `require('./x.svg')`, `import('./x.svg')` or `export * from './x.svg'`, so search for `.svg'` in your code before you delete the loader.

**Next.js:** delete the `.svg` rule from `next.config.*`, for both Turbopack and webpack, and then remove `@svgr/webpack`:

```ts
// next.config.ts: delete these
const nextConfig = {
  turbopack: {
    rules: { "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" } },
  },
  webpack(config) {
    config.module.rules.push({ test: /\.svg$/i, use: ["@svgr/webpack"] });
    return config;
  },
};
```

**Vite:** remove `svgr()` from `vite.config.*`, remove `/// <reference types="vite-plugin-svgr/client" />`, and uninstall `vite-plugin-svgr`.

**Create React App:** SVGR is built in, so there is nothing to remove.

Then delete any `declare module '*.svg'` file you wrote for SVGR. Icon names are now typed by svgworm's generated `svgworm/icons.d.ts`.

## The limit: inner paths

svgworm renders each icon as `<svg><use href="sprite.svg#id"/></svg>`. The browser draws the paths inside a `<use>` shadow tree, and the page's CSS and JavaScript cannot reach them. You can color the whole icon (`color`, `currentColor`), size it and label it. You cannot style or animate one path, for example:

- a CSS rule like `.logo path:nth-child(2) { … }`;
- a Framer Motion path animation;
- a `@keyframes` rule inside the SVG.

svgworm has no inline-sprite mode to work around this (ADR-0024), so **keep SVGR for those icons**. Both work in the same app. To leave such a file out of the sprite, add it to the source's `exclude` globs in [the config](/docs/config/).
