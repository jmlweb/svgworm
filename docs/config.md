# Config

`svgworm.config.json` is optional. It has a [JSON Schema](../packages/svgworm/svgworm.schema.json), published as `svgworm/schema.json`:

```json
{
  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",
  "sources": ["icons"],
  "color": [{ "match": "brand/*", "color": "preserve" }]
}
```

| Key          | Default        | Meaning                                                                                                              |
| ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `sources`    | required       | Folders with the SVG files                                                                                           |
| `outDir`     | `public/icons` | Where sprite files go. Needs `publicPath` when set                                                                   |
| `publicPath` | `/icons`       | Same-origin URL path the sprites are served from                                                                     |
| `moduleDir`  | `svgworm`      | Where the manifest and types go                                                                                      |
| `flatten`    | `false`        | Drop folder names from icon names                                                                                    |
| `color`      | `[]`           | Per-icon overrides. `match` is a glob on the icon name; `color` is `auto`, `mono` or `preserve`. The last match wins |

CLI flags override these keys. See the [CLI reference](cli.md).
