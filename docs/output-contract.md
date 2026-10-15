# Output contract v0.1

> Frozen for v0.1 by [ADR-0012](adr/0012-output-contract-v0.1.md). It is a public API. Changes need an ADR, and a changeset with a "Breaking" note when they break consumers.

The output contract is the boundary between the core and the adapters. Adapters may only read what is listed here.

## Scope and stability

- **v0.1 scope:** one sprite group (`icons`), the manifest with `color: mono | multicolor` and its per-icon `delivery`, the types, and the naming rules below. Sprite files and stack files are both in scope because the delivery forms need them ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md)).
- **Not in v0.1:** multiple sprite groups or namespace-based splitting in one build ([ADR-0023](adr/0023-several-sprites-through-one-config-per-sprite.md): one config per sprite instead). Inline sprite output is rejected ([ADR-0024](adr/0024-no-inline-sprite-output.md)). Per-namespace types were considered and rejected ([ADR-0014](adr/0014-icon-name-type-shape.md)). A consumer never sees these in v0.1 output.
- **0.x policy:** until `1.0.0`, a breaking change to the output contract is a **minor** bump, with a "Breaking" note in the changeset ([ADR-0009](adr/0009-license-versioning-and-release.md)). The manifest's `version` field changes only when the manifest format changes. `1.0.0` comes with its own ADR, when the contract is declared stable.
- **Zero icons:** an error (exit code 2). No file is written.
- **Byte-level details:** generated JSON and `.js`/`.d.ts` use LF, 2-space indent, `JSON.stringify` quoting, and one trailing newline. SVG bytes come from the pinned svgo version of [ADR-0008](adr/0008-tech-stack-and-package-layout.md) with the core's fixed config; TSK-011 pins and documents that config. Naming follows the Unicode tables of the supported Node range, and a character assigned in a newer Unicode version may name differently ([ADR-0007](adr/0007-icon-naming-and-collision-policy.md)).
- A sample of the generated output for one fixture set is in [samples/output-contract-v0.1/](samples/output-contract-v0.1/). The core reproduces it byte for byte, and `sample.test.ts` checks that. The sprite and stack were regenerated from product code in TSK-011: the TSK-004 spike never ran svgo, so its bytes could not be reproduced once the pinned svgo config is applied. The manifest keys, types, and structure did not change; only the sprite and stack bytes, and so their content hashes, did.

## Generated artifacts

### 1. Sprite file(s)

- One SVG file per sprite group, named `<group>.<hash>.svg`. `<hash>` is the first 8 lowercase hex characters of SHA-256 over the file's exact bytes. v0.1 has one group, `icons` ([ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md))
- Written to `outDir` (default `public/icons`), and served at `<publicPath>/<file>` (default `/icons`). svgworm deletes only stale files matching `^icons(\.stack)?\.[0-9a-f]{8}\.svg$` or `^icons\.loader\.[0-9a-f]{8}\.js$` (R-15, ADR-0010, [ADR-0027](adr/0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md))
- Contains one `<symbol id="<iconId>" viewBox="…">` per icon
- Must not contain scripts or external references
- License notices survive: an XML comment in a source file whose text starts with `@license` or `!` (the conventions icon packages and minifiers use) is written once per distinct text, trimmed, before the root element of the sprite or stack that holds the icon, sorted by code point. Every other comment is dropped (TSK-066; the comment bytes are part of the content hash)
- Internal ids (gradients, masks, clip paths) are prefixed per icon so they can't collide
- `<style>` rules must not leak between icons. Every rule is inlined, and a `<style>` left over is an error ([ADR-0004](adr/0004-per-icon-color-classification.md), [ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))
- Contains only icons that don't depend on `url(#…)` references ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))
- Must be served from the same origin as the page. Browsers block cross-origin `<use>` (ADR-0006, Q-02). The one exception is `crossOrigin: "inject"` (section 1c)

### 1b. Stack file ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))

- One content-hashed SVG holding the icons that use `url(#…)` references (gradients, clipPath, masks, filters, markers). WebKit doesn't render those through an external `<use>`
- Each icon is a nested `<svg id="<iconId>" viewBox="…">`, shown only when it is the URL `:target`. One generated `:target` rule is the only `<style>` in the file
- Named `<group>.stack.<hash>.svg`, same hash rule and `outDir` as the sprite. Not written when no icon needs it ([ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md))

### 1c. Loader file (`crossOrigin: "inject"` only, [ADR-0027](adr/0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md))

- Named `<group>.loader.<hash>.js`, same hash rule and `outDir` as the sprite, LF, no dependencies. Written only with `crossOrigin: "inject"` and only when some icon has `delivery: use`, after the sprite and stack and before the module
- The sprite URL and the sprite's `integrity` are baked in. It fetches the sprite with `mode: "cors"`, `credentials: "omit"` and `integrity`, parses it with `DOMParser` as `image/svg+xml`, keeps only SVG-namespace elements (minus `script`, `foreignObject`, `style`, `a`, and SMIL that animates a link or a handler), removes `on*` and URL-loading attributes, script schemes, and any `href` or `url()` that leaves the sprite, and prepends it to `<body>` once (hidden, `aria-hidden`, marked `data-svgworm="<integrity>"`), putting it back when a router replaces `<body>`. On failure it injects nothing and logs `svgworm: sprite not loaded from <url>: <reason>`
- The page loads it with `<script async src integrity crossorigin="anonymous">`, both values from the manifest

### 2. Manifest

Decided by [ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md) (Q-20, Q-24, Q-05 field names). Written to `moduleDir` (default `svgworm/`, never inside a served folder) in two forms of the same object:

- `icons.js`: an ESM module, data only and importing nothing, that exports `manifest`, plus `icons.d.ts` with its types (see Types);
- `manifest.json`: the same object, for non-JS consumers, templates, and `svgworm check`.

```json
{
  "version": 1,
  "sprites": {
    "icons": {
      "sprite": {
        "file": "icons.d907d82b.svg",
        "url": "/icons/icons.d907d82b.svg"
      },
      "stack": {
        "file": "icons.stack.91bff0b3.svg",
        "url": "/icons/icons.stack.91bff0b3.svg"
      }
    }
  },
  "icons": {
    "brand/sunset": {
      "sprite": "icons",
      "id": "i-brand--sunset",
      "viewBox": "0 0 24 24",
      "color": "multicolor",
      "delivery": "img"
    },
    "home": {
      "sprite": "icons",
      "id": "i-home",
      "viewBox": "0 0 24 24",
      "color": "mono",
      "delivery": "use"
    }
  }
}
```

| Field                               | Meaning                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                           | Contract version: `1`, or `2` with `crossOrigin: "inject"` (below). An adapter that doesn't know the value fails loudly                                                       |
| `sprites.<group>.sprite` / `.stack` | `{ file, url }`, or `null` when that file has no icons. `file` is the bare file name in `outDir`, and `url` is `publicPath + "/" + file`                                           |
| `icons.<name>`                      | Keyed by public name, sorted by code point ([Ordering](#ordering))                                                                                                                 |
| `icons.<name>.sprite`               | The group key in `sprites`                                                                                                                                                         |
| `icons.<name>.id`                   | The symbol id ([Symbol id](#symbol-id))                                                                                                                                            |
| `icons.<name>.viewBox`              | The icon's `viewBox`                                                                                                                                                               |
| `icons.<name>.color`                | `mono` or `multicolor` ([ADR-0004](adr/0004-per-icon-color-classification.md))                                                                                                     |
| `icons.<name>.delivery`             | `use`, `img`, or `mask` ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md)). `use` reads `sprite.url`, and `img` and `mask` read `stack.url`. Append `#` + `id` |

With `crossOrigin: "inject"` ([ADR-0027](adr/0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md)) the manifest is version 2. Everything above holds, plus:

| Field                               | Meaning                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `crossOrigin`                       | `"inject"`. Only in version 2                                                                                                   |
| `sprites.<group>.sprite.integrity`  | `sha384-<base64>` of the sprite's bytes                                                                                         |
| `sprites.<group>.loader`            | `{ file, url, integrity }` of the loader file, or `null` when no icon is in the sprite                                         |
| `icons.<name>.delivery` `use`       | Renders `<use href="#{id}">`: the loader put the sprite in the page. `img` and `mask` still read `stack.url` (`mask` needs CORS) |

Default builds never emit these fields, so their bytes, `version: 1` included, are the same as before. The sample of the version 2 form is in [`core/__snapshots__/inject/`](../packages/svgworm/src/core/__snapshots__/inject/).

`publicPath` rules:

- It must start with a single `/` and must not contain `?`, `#`, `\`, or whitespace. A trailing `/` is removed, so `/` alone is the site root and normalizes to the empty string: `url` is then `"/" + file`, never `//file`. Empty segments (`//`), `.` and `..` segments, `%`, and non-ASCII characters are rejected with exit code 2.
- Relative, protocol-relative, and `http(s):` values exit with code 2, because sprites must be same-origin (ADR-0006). With `crossOrigin: "inject"` an `https://<host>[:port]` origin may come before the path (no user info; the host is lower-cased), and `http:` still exits 2.
- It must include the app's mount point, for example `/docs/icons` under a Next `basePath: '/docs'`.
- If `outDir` is set without `publicPath`, it is a config error.
- `outDir`, `publicPath` and `moduleDir` are descriptive terms. The config keys that set them are outside this contract (TSK-011).
- The key names above are frozen for v0.1. Renaming one is a breaking change.

### 3. Types

`icons.d.ts` exports these names, and no others are part of the contract:

- `type IconName`: a plain union of all public names, sorted by code point. A name that is not in the union is a type error. This shape is final for every set size: at 20,000 names it type-checks in 0.14 s on TypeScript 6 and 0.05 s on TypeScript 7 ([ADR-0014](adr/0014-icon-name-type-shape.md))
- `interface SvgwormFile { readonly file: string; readonly url: string }`
- `interface SvgwormIcon { readonly sprite: string; readonly id: string; readonly viewBox: string; readonly color: 'mono' | 'multicolor'; readonly delivery: 'use' | 'img' | 'mask' }`
- In version 2, `SvgwormManifest` has `readonly version: 2; readonly crossOrigin: 'inject'`, a new `interface SvgwormIntegrityFile extends SvgwormFile { readonly integrity: string }` types `sprite` and `loader`, and each group has `readonly loader: SvgwormIntegrityFile | null`. Default output keeps the version 1 types below byte for byte.
- `interface SvgwormManifest<Name extends string> { readonly version: 1; readonly sprites: Readonly<Record<string, { readonly sprite: SvgwormFile | null; readonly stack: SvgwormFile | null }>>; readonly icons: Readonly<Record<Name, SvgwormIcon>> }`
- `declare const manifest: SvgwormManifest<IconName>`

`icons.js` exports the same `manifest` value as data ([ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md)). The sample in [samples/output-contract-v0.1/svgworm/icons.d.ts](samples/output-contract-v0.1/svgworm/icons.d.ts) is the reference.

### 4. Inline sprite

There is no inline sprite output ([ADR-0024](adr/0024-no-inline-sprite-output.md)): in a Server Component app the inline markup is sent twice per page (HTML and RSC payload) and is never cached on its own. No inline file or field is emitted.

## Icon naming

Decided by [ADR-0007](adr/0007-icon-naming-and-collision-policy.md) (Q-31, Q-32, R-02, R-03). Each icon has two identifiers, and both are pure functions of the icon's path relative to its source folder. Nothing else feeds them: not crawl order, absolute paths, timestamps, locale, or the file contents.

|          | **Public name** (`<iconName>`)                                     | **Symbol id** (`<iconId>`)                               |
| -------- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| Used in  | TS types, manifest keys, the adapter's `name` prop                 | `<symbol id>` in the sprite, `#fragment` in `<use href>` |
| Alphabet | Unicode letters (lowercased), marks, and numbers, plus `-` and `/` | ASCII `a-z 0-9 - _` only                                 |
| Example  | `social/github`, `non-ascii/café`                                  | `i-social--github`, `i-non-ascii--caf_e9_`               |

### Public name

Input: the file's path relative to the source folder it was found in.

1. **Separators.** Treat `\` and `/` as path separators. Split into segments.
2. **Inputs and extension.** Inputs are regular files whose name ends in `.svg`, matched case-insensitively (`.SVG` counts). Other files are ignored, and a folder named `x.svg` is still a folder. Files and folders whose name starts with `.` are not inputs (this also skips macOS `._*` files). Remove the one `.svg` extension. `\` is a separator on every OS, so a Linux file literally named `a\b.svg` becomes `a/b`.
   - A path that isn't valid Unicode is an **error**: undecodable bytes on Linux, lone surrogates on Windows, or anything that decodes to U+FFFD. It is never silently replaced.
3. **Folders.** By default every folder segment is kept, so folders become namespaces (R-02). With `flatten` on, only the file segment is kept. The config key that turns it on is not part of this contract; the naming rules are.
4. **Per segment**, in this order:

   1. Unicode-normalize to **NFC**.
   2. Lowercase with the locale-independent Unicode default mapping (`String.prototype.toLowerCase`, never `toLocaleLowerCase`), then NFC again. This is default lowercasing, not case folding: `ß` stays `ß`, and a few uppercase letters with no lowercase form (`ℂ`, `ϒ`) stay as they are.
   3. Replace final sigma `ς` with `σ`. `toLowerCase` picks one or the other depending on the neighbouring characters, so without this step a case-only rename could change the name (`ΟΔΟΣ.ΚΑΤΩ` vs `ΟΔΟΣ_ΚΑΤΩ`).
   4. Replace each separator run with a single `-`. A separator run starts with:

      - a character that is not a letter, mark, or number (`[^\p{L}\p{M}\p{N}]`), such as a space, `_`, `.`, `@`, `=`, `+`, or an emoji;
      - a default-ignorable code point (`\p{Default_Ignorable_Code_Point}`): variation selectors, zero-width joiners, bidi controls;
      - or a combining mark at the start of the segment.

      The run then continues over any following characters of those kinds, including combining marks. So a mark survives only when it is attached to a letter or number, and nothing invisible is ever left in a name.

   5. Trim `-` from both ends.
   6. If the segment is now empty, it is an **error** for that file (`🔥.svg`, `❤️.svg`, `---.svg`, a folder named `_`).

5. **Join** the segments with `/`.

What this implies:

- The name never contains ASCII uppercase, `_`, `.`, whitespace, invisible characters, `--`, or a leading or trailing `-`. A segment never starts or ends with `-`, and never starts with a combining mark.
- **No camelCase splitting.** `ArrowLeft.svg` becomes `arrowleft`, not `arrow-left`. Case can't carry meaning, because case-insensitive file systems and git (`core.ignorecase`) don't reliably keep case-only renames. A segment with a lowercase letter followed by an uppercase one gets a `name/case-folded` warning that suggests the readable file name ([ADR-0021](adr/0021-no-camel-case-splitting-warn-when-case-carried-meaning.md)); the name itself does not change.
- **No transliteration and no compatibility folding.** `café` stays `café`. Full-width `１２` is not the same name as `12`, and look-alike characters from different scripts stay distinct. Non-ASCII names are valid TS string literals.
- No length limit beyond the file system's own.
- Names may start with a digit (`2fa`, `24/add`). No name is reserved. Adapters look names up with `Map` or `Object.hasOwn`, never with a bare `obj[name]`, so a name like `constructor` is safe.
- An icon named `social` and an icon named `social/github` may both exist.
- Any path svgworm writes to output is also NFC-normalized and uses `/`. Error messages show the path as found on disk.

### Symbol id

The symbol id is derived from the public name only:

1. Start with the fixed prefix `i-`.
2. Append each character of the name:
   - `a-z`, `0-9`, and `-` stay as they are;
   - `/` becomes `--`;
   - any other character (always non-ASCII by now) becomes `_` + its code point in lowercase hex, no padding + `_` (`é` → `_e9_`).

Guarantees:

- The id is always a valid XML `NCName`, HTML id, CSS identifier, and URL fragment, with no escaping or percent-encoding needed.
- The mapping is injective: `--` and `_` can't occur inside a name, so two different names never share an id.
- Every other id in the sprite (gradients, masks, clip paths) is an **internal id** of the form `<symbolId>_<n>`. `<n>` is a decimal ordinal from 1, assigned in document order of the optimized icon, so it is a pure function of the icon's content.

  - An internal id is never a symbol id: in a symbol id every `_` opens a `_hex_` group that is closed again, while the trailing `_<n>` is never closed.
  - Two icons' internal ids can't collide, because the last `_` splits an internal id into exactly one symbol id and one ordinal.
  - Internal ids are also valid NCNames and CSS identifiers. `.` is avoided because it would read as a class selector in CSS and as a syncbase separator in SMIL `begin` values.


- Adapters copy the id from the manifest. They never derive it from the name.

### Collisions

- Two or more files that produce the same public name are an **error** (R-03). That includes `Icon.svg` and `icon.svg` on a case-sensitive file system, an NFC and an NFD `café.svg`, `arrow_left.svg` and `arrow-left.svg`, and the same name found in two source folders.
- The error lists every file involved in the collision. All naming errors are collected and reported together with the other R-04 errors, and no output is written.
- Error output never depends on crawl order: errors are sorted by the NFC relative path, files inside a collision are sorted the same way, and each error appears once.
- Nothing is renamed, numbered, or picked by order. There is no alias map ([ADR-0025](adr/0025-no-alias-map-for-icon-names.md)): rename the file, or exclude a package file.
- With several source folders, names from all of them share one space. No folder overrides another. Source folders that overlap (one inside another) are a config error, so a file is never seen twice.
- Symbolic links are not followed in v0.1.

### Ordering

Wherever names are sorted (types, manifest), and for sprite symbols and stack icons (sorted by public name, not by id), they are compared by Unicode code point, which is the same as UTF-8 byte order. Never use `localeCompare` or JS's default UTF-16 order.

### Examples

Paths are relative to the source folder. Checked by `spikes/TSK-006-icon-naming/check.mjs`.

| Input path                                        | Public name                                   | Symbol id                                     |
| ------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `home.svg`                                        | `home`                                        | `i-home`                                      |
| `Arrow Left.svg`                                  | `arrow-left`                                  | `i-arrow-left`                                |
| `arrow_left.svg`                                  | `arrow-left`                                  | `i-arrow-left`                                |
| `ArrowLeft.svg`                                   | `arrowleft`                                   | `i-arrowleft`                                 |
| `IC_Close.SVG`                                    | `ic-close`                                    | `i-ic-close`                                  |
| `icon.filled.svg`                                 | `icon-filled`                                 | `i-icon-filled`                               |
| `logo@2x.svg`                                     | `logo-2x`                                     | `i-logo-2x`                                   |
| `Property 1=Default.svg` (Figma variant export)   | `property-1-default`                          | `i-property-1-default`                        |
| `C++.svg`                                         | `c`                                           | `i-c`                                         |
| `social/github.svg`                               | `social/github`                               | `i-social--github`                            |
| `social\github.svg` (Windows)                     | `social/github`                               | `i-social--github`                            |
| `Social Media/GitHub.svg`                         | `social-media/github`                         | `i-social-media--github`                      |
| `a-b/c.svg`                                       | `a-b/c`                                       | `i-a-b--c`                                    |
| `a/b-c.svg`                                       | `a/b-c`                                       | `i-a--b-c`                                    |
| `24/add.svg`                                      | `24/add`                                      | `i-24--add`                                   |
| `2fa.svg`                                         | `2fa`                                         | `i-2fa`                                       |
| `Straße.svg`                                      | `straße`                                      | `i-stra_df_e`                                 |
| `icon.svg.svg`                                    | `icon-svg`                                    | `i-icon-svg`                                  |
| fixture `duplicates/actions/close.svg`            | `actions/close`                               | `i-actions--close`                            |
| fixture `duplicates/arrows/close.svg`             | `arrows/close`                                | `i-arrows--close`                             |
| both `duplicates/*/close.svg` with `flatten`      | error: collision on `close`, lists both files |                                               |
| fixture `non-ascii/café.svg` (NFC)                | `café`                                        | `i-caf_e9_`                                   |
| `café.svg` with NFD bytes, or `CAFÉ.svg`          | `café`                                        | `i-caf_e9_`                                   |
| fixture `non-ascii/日本.svg`                      | `日本`                                        | `i-_65e5__672c_`                              |
| `Icon.svg` and `icon.svg` in one folder           | error: collision on `icon`, lists both files  |                                               |
| `ΟΔΟΣ.ΚΑΤΩ.svg`, `ΟΔΟΣ_ΚΑΤΩ.svg`, `οδος.κατω.svg` | `οδοσ-κατω`                                   | `i-_3bf__3b4__3bf__3c3_-_3ba__3b1__3c4__3c9_` |
| `home︀.svg` (`home` + variation selector U+FE00)  | `home` (so it collides with `home.svg`)       | `i-home`                                      |
| `_` + U+0301 (combining acute) + `x.svg`          | `x`                                           | `i-x`                                         |
| `１２.svg` (full-width digits)                    | `１２`                                        | `i-_ff11__ff12_`                              |
| `🔥.svg`, `❤️.svg`, `---.svg`                     | error: empty name                             |                                               |
| `caf\xE9.svg` (Latin-1 bytes, invalid UTF-8)      | error: not valid Unicode                      |                                               |
| `_/close.svg`                                     | error: empty folder segment                   |                                               |
| `.hidden.svg`, `._close.svg`                      | ignored (dotfile)                             |                                               |

## Adapter expectations (React)

- Reads the manifest at build time, never at runtime over the network. The user passes the generated module's `manifest` to the adapter once (for example `createIcon(manifest)`; the adapter's own API lives in `@svgworm/react`, not in this contract), because the adapter can't import a path inside the user's project ([ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md))
- Renders by the icon's `delivery` ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md)):
  - `use`: `<svg viewBox focusable="false"><use href="{url}#{id}"/></svg>`. `viewBox` on the consumer is optional, since the symbol's is enough. `@svgworm/react` makes it 1em wide and high unless the caller sets a size;
  - `img` (multicolor with references): `<img src="{stackUrl}#{id}" width height alt="…">`;
  - `mask` (mono with references): a `<span>` masked by `url("{stackUrl}#{id}")` with `background-color: currentColor`
- With a version 2 manifest, `use` icons render `<use href="#{id}">`, and the adapter offers a way to render the loader tag once (`createSpriteLoader(manifest)` in `@svgworm/react`, `SvgwormLoader.astro` from `init`)
- Adds `aria-hidden="true"` unless a title or label is given; with a title it renders `role="img"` and a `<title>`
- Takes no part in SVG processing

The `Icon.astro` that `svgworm init` generates for Astro ([ADR-0017](adr/0017-astro-support-via-generated-icon-astro.md)) follows the same rules and renders the same markup.
