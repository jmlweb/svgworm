---
title: Troubleshooting
description: "Fixes for the problems people hit with svgworm: a blank icon in Safari, a sprite that 404s, an icon in the wrong color, name collisions, svgworm check failing in CI, and every diagnostic code with its fix."
order: 7
---

Start with the symptom. The [diagnostic codes](#diagnostic-codes) at the end cover every error and warning the CLI prints.

## An icon is blank in Safari

Chromium and Firefox show it, **WebKit does not**. Three causes, in order of likelihood:

1. **The sprite is on another origin.** WebKit (and every browser, in fact) refuses an external `<use>` from a CDN or another subdomain. `publicPath` must be a same-origin path such as `/icons`. That is why the config rejects `https://…` and `//…` values. **Serve the sprite from the app's own origin.** Cross-origin sprites are planned as an opt-in (TSK-067).
2. **You built the `<use>` yourself** from the icon name. Icons that use gradients, masks, clip paths, filters or markers do not render through an external `<use>` in WebKit. So svgworm delivers them from the stack file as `<img>` or a CSS mask ([how it works](/docs/how-it-works/#delivery)). **Always render through `Icon`**, which reads `delivery` from the manifest. Or read `icons[name].delivery` yourself.
3. **The icon has a `<style>` that could not be inlined.** The build would have failed with `style/leftover` or `style/unscopable`. If an old sprite is still deployed, rebuild and redeploy.

Still blank everywhere? Open the sprite URL from the manifest in a tab. A 404 means the [sprite is not where the page expects it](#the-sprite-404s).

## The sprite 404s

**Every icon is missing**, and the network tab shows a 404 for `/icons/icons.<hash>.svg`.

- **A mount point is missing from `publicPath`.** Next `basePath`, Astro `base` and Vite `base` are not added to the URLs svgworm writes. With a base of `/docs`, set `--public-path /docs/icons` or `"publicPath": "/docs/icons"` in `svgworm.config.json`, then rebuild ([Next.js](/docs/nextjs/#basepath), [Astro](/docs/astro/#base), [Vite](/docs/vite/#base)).
- **`outDir` is inside a source folder.** For example `--source public/icons` with the default `outDir` `public/icons`: the next build would read the sprites as icons, so the config is refused. Keep the SVG files outside `public/` (`icons/` is the default) and let svgworm write to `public/icons`, or pick another output with `--out-dir`.
- **`outDir` and `publicPath` disagree.** A custom `outDir` must be served at `publicPath`. Under `public/` svgworm derives it (`public/sprites` gives `/sprites`), so pass `publicPath` only to add a mount point. For an `outDir` outside `public/`, **pass both flags together**: the config refuses `outDir` on its own.
- **The deploy replaced the sprite under cached HTML.** Each build writes a new hashed file and removes the old one. HTML from the previous deploy that a CDN still serves points at a hash that is gone. A tab that already loaded the sprite is fine, because every icon is in that one file.

  svgworm keeps only the current sprite on purpose, so the output stays a pure function of your icons ([ADR-0022](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0022-builds-keep-only-the-current-sprite.md)). **Fix it in the deploy:**

  - Upload the sprite before the HTML.
  - Keep HTML caches short, or purge them on deploy.
  - When you sync `outDir` to a bucket, do not delete old files: `aws s3 sync` without `--delete`, `rclone copy` instead of `rclone sync`.

  Hashed names never collide, so old files can expire by age. The sprite itself can be cached for a year, because its name changes with its content.
- **The sprites are on a CDN (`crossOrigin: "inject"`) and every `use` icon is blank.** Check the console for `svgworm: sprite not loaded from …`. It has three causes:

  - A missing `Access-Control-Allow-Origin` on the CDN.
  - A CSP without the CDN in `connect-src`.
  - A sprite that no longer matches its integrity. Upload `outDir` again.

  **No message at all means the loader tag is missing.** Render `<SpriteLoader />` or `<SvgwormLoader />` once ([Sprites on a CDN](/docs/config/#sprites-on-a-cdn)).
- **The committed output is stale.** Someone changed an icon and did not run `svgworm`, so the manifest in git points at a sprite that no build produced. **`svgworm check` in CI catches this** before a deploy.

## An icon is black, or the wrong color

- **It is multicolor and you expected it to follow the text color.** svgworm keeps the colors of an icon that has more than one (a two-tone icon, a dark outline with a white fill). Add `{ "match": "<name>", "color": "mono" }` to `color` in the config ([color overrides](/docs/config/#color-overrides)) only if the icon really is one color. Otherwise the build fails with `color/forced-mono-unsafe` and says what it found.
- **It is mono and black.** It follows `currentColor`, so it is black because the parent's `color` is black. **Set `color` on the parent or on the icon** ([coloring](/docs/icon/#coloring)).
- **`fill` on the `<svg>` does nothing.** The symbol's own `fill="currentColor"` wins inside a `<use>`. **`color` is the knob**, not `fill` or `stroke`.
- **It is an `img` icon and `color` does nothing.** Correct: an `<img>` cannot inherit `currentColor`. The icon is multicolor and needs the stack file. It keeps its own colors by design.
- **A mono icon lost its colors.** A `mono` rule matched it, so svgworm flattened every paint to `currentColor`. Narrow the rule's `match` glob, or add a later `preserve` rule for that icon. The last match wins.

## Name collision

```text
error [name/collision] icons/arrow-left.svg: name "arrow-left" is produced by 2 files: icons/arrow-left.svg, icons/arrow_left.svg. Fix: rename one of the files
```

Names come from file paths, lower-cased, with every run of `_`, spaces and punctuation turned into one `-` ([naming](/docs/how-it-works/#names)). Two files that normalize to the same name are **an error, never a silent rename**. Examples:

- `arrow_left.svg` and `arrow-left.svg`.
- `Icon.svg` and `icon.svg`.
- `home.svg` in two folders when `flatten` is on.

The message says which fix applies:

- **Rename one file.**
- **Turn `flatten` off,** so folder names stay in the icon names (`ui/home` and `nav/home`).
- **Leave one out:** when one of the files comes from an icon package, leave it out with [`exclude`](/docs/config/#icons-from-a-package) instead.

There is no alias map: a name always comes from its path ([ADR-0025](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0025-no-alias-map-for-icon-names.md)).

## `svgworm check` fails in CI

`check` compiles the icons and compares the result with the files in git. **Exit 1 lists what differs.**

- **`missing` or `changed` files, icons `added` or `removed`:** someone changed an icon and did not commit the output. **Run `svgworm` locally** and commit `public/icons/` and `svgworm/`.
- **Everything `changed` and the icons match:** local and CI run different svgworm versions, and the output changed between them (a minor can change the bytes before 1.0). **Commit the lockfile** and install from it in CI.
- **Only `.js`, `.d.ts` or `.json` files `changed` on Windows runners:** git converted line endings. svgworm writes LF. Keep the generated files LF with a `.gitattributes` rule such as `svgworm/** text eol=lf` and `public/icons/** text eol=lf`.
- **`stale` sprite:** an old hashed file is still in `public/icons/`. Run `svgworm` and commit the deletion.
- **It passes locally and fails in CI with `build/no-icons`:** the source folder is not in the checkout. Check `sources` and `.gitignore`.
- **Run `check` before the build step,** not after it. `prebuild` regenerates the files, so a check after the build proves nothing.

## Diagnostic codes

The CLI prints each one as `[code] file: message` on stderr. `--json` lists them in `errors` or `warnings`. **Errors stop the build and nothing is written.** Warnings do not.

| Code                       | Kind    | Meaning and fix                                                                                                                                                            |
| -------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name/collision`           | error   | Two files map to one name. Rename one, or turn `flatten` off ([above](#name-collision))                                                                                    |
| `name/case-folded`        | warning | A file or folder name is camelCase or PascalCase (`ArrowLeft.svg`), so the name folds case (`arrowleft`). The message suggests the name for a readable one (`arrow-left.svg`); rename it to silence the warning. A camelCase folder is reported once, not once per file |
| `name/empty-segment`       | error   | A file or folder name has no letters or digits left after normalizing (`🔥.svg`, `---.svg`, a folder named `_`). Rename it                                                 |
| `path/invalid-encoding`    | error   | The file name is not valid Unicode (undecodable bytes, lone surrogates). Rename the file                                                                                   |
| `path/not-svg`             | error   | The file does not end in `.svg`. Only `.svg` files are inputs                                                                                                              |
| `svg/invalid-encoding`     | error   | The file is not valid UTF-8. Re-export it as UTF-8                                                                                                                         |
| `svg/invalid-xml`          | error   | The file is not well-formed XML; the message gives the line and column. Re-export it, or fix the markup                                                                    |
| `svg/not-svg-root`         | error   | The root element is not `<svg>` (an HTML page saved as `.svg`, an empty file). Replace the file                                                                            |
| `svg/forbidden-element`    | error   | `<script>`, `<foreignObject>` and similar are never put in a sprite. Remove them                                                                                           |
| `svg/forbidden-attribute`  | error   | `on*` event handlers and `javascript:` values are rejected. Remove them                                                                                                    |
| `svg/external-reference`   | error   | `href` or `url(…)` points outside the file (another file, a URL). Inline the asset or remove the reference                                                                 |
| `style/unscopable`         | error   | A `<style>` has an at-rule (`@media`, `@keyframes`) that cannot be inlined. Convert it to attributes, or drop it                                                           |
| `style/leftover`           | error   | A `<style>` has rules that cannot be inlined, such as `:hover` on an element that exists. The message lists them. Rules that match nothing are dropped, so unused Illustrator classes are fine |
| `viewbox/underivable`      | error   | No `viewBox`, and `width`/`height` are not plain numbers or `px`. Add a `viewBox`                                                                                          |
| `viewbox/invalid`          | error   | The `viewBox` is not four numbers with a positive width and height. Fix it                                                                                                 |
| `viewbox/derived`          | warning | The `viewBox` was derived from `width` and `height`. Fine; add a `viewBox` to the file to silence it                                                                       |
| `color/forced-mono-unsafe` | error   | A `mono` rule matched an icon with content that cannot follow `currentColor` (a raster image, a pattern fill, a CSS variable paint, a color animation). Use `preserve`, or narrow the rule |
| `io/unreadable`            | error   | A source file cannot be read. Check its permissions                                                                                                                        |
| `build/no-icons`           | error   | No `.svg` file in the source folders. Check `sources` (exit code 2)                                                                                                        |
| `cli/usage`                | fatal   | A usage or config error: unknown flag, missing config, an invalid key, a bad `publicPath`. The message says which (exit code 2)                                            |
| `cli/unexpected`           | fatal   | An I/O failure or a bug in svgworm, reported as `unexpected failure: …` (exit code 1). Please [open an issue](https://github.com/jmlweb/svgworm/issues) with the message   |

The same table, with the agent-oriented wording, is in the [Next.js](https://github.com/jmlweb/svgworm/blob/main/skills/svgworm-nextjs/SKILL.md) and [Astro](https://github.com/jmlweb/svgworm/blob/main/skills/svgworm-astro/SKILL.md) agent skills.
