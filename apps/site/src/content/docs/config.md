---
title: Config
description: Every svgworm.config.json key and its default, per-icon color overrides, and the JSON Schema that editors and AI agents validate against.
order: 6
---

`svgworm.config.json` is optional: every key except `sources` has a default, and CLI flags can replace the file entirely. Point `$schema` at the [JSON Schema](https://github.com/jmlweb/svgworm/blob/main/packages/svgworm/svgworm.schema.json) to get autocomplete and validation in your editor. The package also exports it as `svgworm/schema.json`.

```json
{
  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",
  "sources": ["icons"],
  "color": [{ "match": "brand/*", "color": "preserve" }]
}
```

| Key          | Default        | Meaning                                                                                         |
| ------------ | -------------- | ----------------------------------------------------------------------------------------------- |
| `sources`    | required       | Folders with the SVG files: a path, or `{ "dir", "include", "exclude" }` to pick files by glob  |
| `outDir`     | `public/icons` | Where sprite files go. Needs `publicPath` when set                                              |
| `publicPath` | `/icons`       | Same-origin URL path the sprites are served from                                                |
| `moduleDir`  | `svgworm`      | Where the manifest and types go                                                                 |
| `flatten`    | `false`        | Drop folder names from icon names                                                               |
| `color`      | `[]`           | Per-icon color overrides (see [Color overrides](#color-overrides)). The last matching rule wins |

<aside class="alert alert-tip">

<p class="alert-title">Tip</p>

CLI flags override these keys. See the [CLI reference](/docs/cli/).

</aside>

## Icons from a package

A source can point into `node_modules` and pick files by glob, so an icon set such as [Lucide](https://lucide.dev) or [Tabler](https://tabler.io/icons) is used without copying files or building the whole set:

```json
{
  "sources": [
    "icons",
    {
      "dir": "node_modules/lucide-static/icons",
      "include": ["house.svg", "menu.svg", "arrow-*.svg"],
      "exclude": ["arrow-big-*.svg"]
    }
  ]
}
```

- `dir` is the folder, relative to the config. A string entry is the same as `{ "dir": "…" }`.
- `include` keeps only the files that match one of its globs, `exclude` drops matches after that. Globs are matched against the path inside `dir` with `/` separators and support `*`, `**`, `?`, `[…]` and `{a,b}`: `house.svg`, `arrows/*.svg`, `**/arrow-*.svg`. Without `include`, every `.svg` file counts.
- Names come from the path inside `dir`, as for any source: `house.svg` is `house`. The package folder is not part of the name, so an icon with the same name in two sources is a [collision](/docs/troubleshooting/#name-collision); rename your own file or exclude the package's.
- The whole set builds too (`"dir": "node_modules/lucide-static/icons"` alone), but every page then downloads every icon. Pick what you render; see the [performance notes](/docs/nextjs/#performance-notes).
- `svgworm watch` watches the folder, so a package update rebuilds the sprite. Commit the lockfile so CI resolves the same icons.
- The package's license notice (`<!-- @license lucide-static … - ISC -->`) is kept once at the top of the sprite, so the attribution the license asks for travels with the copies.

The `--source` flag takes paths only; globs need the config file.

## Several sprites

One sprite fits most apps: tens of icons are a few KiB, cached for a year. When a large set splits into parts that different pages use (an app area and a marketing site, say), give each part its own config and build both:

`svgworm.app.json`:

```json
{ "sources": ["icons/app"], "outDir": "public/icons/app", "publicPath": "/icons/app", "moduleDir": "svgworm/app" }
```

`svgworm.marketing.json`:

```json
{ "sources": ["icons/marketing"], "outDir": "public/icons/marketing", "publicPath": "/icons/marketing", "moduleDir": "svgworm/marketing" }
```

```sh
svgworm --config svgworm.app.json && svgworm --config svgworm.marketing.json
```

Each build writes its own manifest and `IconName` type, so make one component per sprite: `createIcon(appManifest)` and `createIcon(marketingManifest)`. Give each config its own `outDir`: both builds name their files `icons.<hash>.svg`, and a build removes the hashed files it did not write. Built-in groups in one config were left out on purpose ([ADR-0023](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0023-several-sprites-through-one-config-per-sprite.md)).

## Color overrides

svgworm decides the color of each icon on its own. A single-color icon becomes mono and follows the CSS `color` of its parent through `currentColor`. An icon with several colors keeps them. When the guess is wrong for an icon, add a rule to `color`:

| `color`    | Effect                                                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auto`     | Let svgworm classify the icon (the default)                                                                                                                                |
| `mono`     | Force `currentColor`, flattening every color in the icon. Fails the build when the icon has content that cannot follow `currentColor`, such as a raster image or a pattern |
| `preserve` | Keep the colors as drawn, even for a single-color icon                                                                                                                     |

`match` is a glob on the icon name, such as `brand/*` or `logo-*`. Rules apply in order and the last match wins, so put broad rules first and exceptions after them:

```json
{
  "color": [
    { "match": "brand/*", "color": "preserve" },
    { "match": "brand/wordmark", "color": "mono" }
  ]
}
```
