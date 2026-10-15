---
title: Config
description: Every svgworm.config.json key and its default, per-icon color overrides, and the JSON Schema that editors and AI agents validate against.
order: 5
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
| `sources`    | required       | Folders with the SVG files                                                                      |
| `outDir`     | `public/icons` | Where sprite files go. Needs `publicPath` when set                                              |
| `publicPath` | `/icons`       | Same-origin URL path the sprites are served from                                                |
| `moduleDir`  | `svgworm`      | Where the manifest and types go                                                                 |
| `flatten`    | `false`        | Drop folder names from icon names                                                               |
| `color`      | `[]`           | Per-icon color overrides (see [Color overrides](#color-overrides)). The last matching rule wins |

<aside class="alert alert-tip">

<p class="alert-title">Tip</p>

CLI flags override these keys. See the [CLI reference](/docs/cli/).

</aside>

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
