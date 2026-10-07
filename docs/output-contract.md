# Output contract (DRAFT)

> This draft is **not final**. Items marked ❓ are tracked in [open-questions.md](open-questions.md). Once accepted, the contract is a public API, and changes need an ADR and a semver note.

The output contract is the boundary between the core and the adapters. Adapters may only read what is listed here.

## Generated artifacts

### 1. Sprite file(s)

- One SVG file per sprite group, named `<group>.<contentHash>.svg` ❓ Q-24 (naming scheme and hash length)
- Contains one `<symbol id="<iconId>" viewBox="…">` per icon
- Must not contain scripts or external references
- Internal ids (gradients, masks, clip paths) are prefixed per icon so they can't collide
- `<style>` rules must not leak between icons (class names prefixed, styles inlined, or rejected) ❓ Q-04

### 2. Manifest

Machine-readable, language-neutral. ❓ Q-20 Format (JSON plus a generated module?)

Conceptual shape:

```
sprites:
  <group>:
    url: <basePath>/<group>.<hash>.svg
    icons: [<iconId>, ...]           # sorted
icons:
  <iconName>:
    sprite: <group>
    id: <iconId>
    viewBox: "0 0 24 24"
    color: mono | multicolor            # ADR-0004
    delivery: external | inline          ❓ Q-05 (only if per-icon inline fallback exists)
```

### 3. Types

- A sorted union, or an `as const` array, of all icon names ❓ Q-30 (shape, chosen after the TS perf spike)
- Per-namespace unions, if namespaces are enabled ❓ Q-30

### 4. Inline sprite (opt-in)

- The same symbols, emitted for embedding in HTML ❓ Q-25 (raw string vs framework component)

## Icon naming

Decided by [ADR-0007](adr/0007-icon-naming-and-collision-policy.md) (Q-31, Q-32, R-02, R-03). Each icon has two identifiers, and both are pure functions of the icon's path relative to its source folder. Nothing else feeds them: not crawl order, absolute paths, timestamps, locale, or the file contents.

| | **Public name** (`<iconName>`) | **Symbol id** (`<iconId>`) |
|---|---|---|
| Used in | TS types, manifest keys, the adapter's `name` prop | `<symbol id>` in the sprite, `#fragment` in `<use href>` |
| Alphabet | Unicode letters (lowercased), marks, and numbers, plus `-` and `/` | ASCII `a-z 0-9 - _` only |
| Example | `social/github`, `non-ascii/café` | `i-social--github`, `i-non-ascii--caf_e9_` |

### Public name

Input: the file's path relative to the source folder it was found in.

1. **Separators.** Treat `\` and `/` as path separators. Split into segments.
2. **Inputs and extension.** Inputs are regular files whose name ends in `.svg`, matched case-insensitively (`.SVG` counts). Other files are ignored, and a folder named `x.svg` is still a folder. Files and folders whose name starts with `.` are not inputs (this also skips macOS `._*` files). Remove the one `.svg` extension. `\` is a separator on every OS, so a Linux file literally named `a\b.svg` becomes `a/b`.
   - A path that isn't valid Unicode is an **error**: undecodable bytes on Linux, lone surrogates on Windows, or anything that decodes to U+FFFD. It is never silently replaced.
3. **Folders.** By default every folder segment is kept, so folders become namespaces (R-02). With `flatten` on, only the file segment is kept. The exact config key is set by the config schema (TSK-011).
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
- **No camelCase splitting.** `ArrowLeft.svg` becomes `arrowleft`, not `arrow-left`. Case can't carry meaning, because case-insensitive file systems and git (`core.ignorecase`) don't reliably keep case-only renames.
- **No transliteration and no compatibility folding.** `café` stays `café`. Full-width `１２` is not the same name as `12`, and look-alike characters from different scripts stay distinct. Non-ASCII names are valid TS string literals.
- No length limit beyond the file system's own.
- Names may start with a digit (`2fa`, `24/add`). No name is reserved. Adapters look names up with `Map` or `Object.hasOwn`, never with a bare `obj[name]`, so a name like `constructor` is safe.
- An icon named `social` and an icon named `social/github` may both exist.
- Any path svgworm writes to output (for example a source path in the manifest) is also NFC-normalized and uses `/`. Error messages show the path as found on disk.

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

  See Sprite file(s) above.
- Adapters copy the id from the manifest. They never derive it from the name.

### Collisions

- Two or more files that produce the same public name are an **error** (R-03). That includes `Icon.svg` and `icon.svg` on a case-sensitive file system, an NFC and an NFD `café.svg`, `arrow_left.svg` and `arrow-left.svg`, and the same name found in two source folders.
- The error lists every file involved in the collision. All naming errors are collected and reported together with the other R-04 errors, and no output is written.
- Error output never depends on crawl order: errors are sorted by the NFC relative path, files inside a collision are sorted the same way, and each error appears once.
- Nothing is renamed, numbered, or picked by order. There is no alias map in v0.1 (TSK-025).
- With several source folders, names from all of them share one space. No folder overrides another. Source folders that overlap (one inside another) are a config error, so a file is never seen twice.
- Symbolic links are not followed in v0.1.

### Ordering

Wherever names are sorted (types, manifest, sprite symbols), they are compared by Unicode code point, which is the same as UTF-8 byte order. Never use `localeCompare` or JS's default UTF-16 order.

### Examples

Paths are relative to the source folder. Checked by `spikes/TSK-006-icon-naming/check.mjs`.

| Input path | Public name | Symbol id |
|---|---|---|
| `home.svg` | `home` | `i-home` |
| `Arrow Left.svg` | `arrow-left` | `i-arrow-left` |
| `arrow_left.svg` | `arrow-left` | `i-arrow-left` |
| `ArrowLeft.svg` | `arrowleft` | `i-arrowleft` |
| `IC_Close.SVG` | `ic-close` | `i-ic-close` |
| `icon.filled.svg` | `icon-filled` | `i-icon-filled` |
| `logo@2x.svg` | `logo-2x` | `i-logo-2x` |
| `Property 1=Default.svg` (Figma variant export) | `property-1-default` | `i-property-1-default` |
| `C++.svg` | `c` | `i-c` |
| `social/github.svg` | `social/github` | `i-social--github` |
| `social\github.svg` (Windows) | `social/github` | `i-social--github` |
| `Social Media/GitHub.svg` | `social-media/github` | `i-social-media--github` |
| `a-b/c.svg` | `a-b/c` | `i-a-b--c` |
| `a/b-c.svg` | `a/b-c` | `i-a--b-c` |
| `24/add.svg` | `24/add` | `i-24--add` |
| `2fa.svg` | `2fa` | `i-2fa` |
| `Straße.svg` | `straße` | `i-stra_df_e` |
| `icon.svg.svg` | `icon-svg` | `i-icon-svg` |
| fixture `duplicates/actions/close.svg` | `actions/close` | `i-actions--close` |
| fixture `duplicates/arrows/close.svg` | `arrows/close` | `i-arrows--close` |
| both `duplicates/*/close.svg` with `flatten` | error: collision on `close`, lists both files | |
| fixture `non-ascii/café.svg` (NFC) | `café` | `i-caf_e9_` |
| `café.svg` with NFD bytes, or `CAFÉ.svg` | `café` | `i-caf_e9_` |
| fixture `non-ascii/日本.svg` | `日本` | `i-_65e5__672c_` |
| `Icon.svg` and `icon.svg` in one folder | error: collision on `icon`, lists both files | |
| `ΟΔΟΣ.ΚΑΤΩ.svg`, `ΟΔΟΣ_ΚΑΤΩ.svg`, `οδος.κατω.svg` | `οδοσ-κατω` | `i-_3bf__3b4__3bf__3c3_-_3ba__3b1__3c4__3c9_` |
| `home︀.svg` (`home` + variation selector U+FE00) | `home` (so it collides with `home.svg`) | `i-home` |
| `_` + U+0301 (combining acute) + `x.svg` | `x` | `i-x` |
| `１２.svg` (full-width digits) | `１２` | `i-_ff11__ff12_` |
| `🔥.svg`, `❤️.svg`, `---.svg` | error: empty name | |
| `caf\xE9.svg` (Latin-1 bytes, invalid UTF-8) | error: not valid Unicode | |
| `_/close.svg` | error: empty folder segment | |
| `.hidden.svg`, `._close.svg` | ignored (dotfile) | |

## Adapter expectations (React)

- Reads the manifest at build time (through a generated module), never at runtime over the network
- Renders `<svg viewBox focusable="false"><use href="{url}#{id}"/></svg>`
- Adds `aria-hidden="true"` unless a title or label is given; with a title it renders `role="img"` and a `<title>`
- Takes no part in SVG processing
