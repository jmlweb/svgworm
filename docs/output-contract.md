# Output contract (DRAFT)

> This draft is **not final**. Items marked ❓ are tracked in [open-questions.md](open-questions.md). Once accepted, the contract is a public API, and changes need an ADR and a semver note.

The output contract is the boundary between the core and the adapters. Adapters may only read what is listed here.

## Generated artifacts

### 1. Sprite file(s)

- One SVG file per sprite group, named `<group>.<contentHash>.svg` ❓ Q-24 (naming scheme and hash length)
- Contains one `<symbol id="<iconId>" viewBox="…">` per icon
- Must not contain scripts or external references
- Internal ids (gradients, masks, clip paths) are prefixed per icon so they can't collide
- `<style>` rules must not leak between icons. Every rule is inlined, and a `<style>` left over is an error ([ADR-0004](adr/0004-per-icon-color-classification.md), [ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))
- Contains only icons that don't depend on `url(#…)` references ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))
- Must be served from the same origin as the page. Browsers block cross-origin `<use>` (ADR-0006, Q-02)

### 1b. Stack file ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md))

- One content-hashed SVG holding the icons that use `url(#…)` references (gradients, clipPath, masks, filters, markers). WebKit doesn't render those through an external `<use>`
- Each icon is a nested `<svg id="<iconId>" viewBox="…">`, shown only when it is the URL `:target`. One generated `:target` rule is the only `<style>` in the file
- Naming and URL handling follow the sprite file ❓ Q-24

### 2. Manifest

Machine-readable, language-neutral. ❓ Q-20 Format (JSON plus a generated module?)

Conceptual shape:

```
sprites:
  <group>:
    url: <basePath>/<group>.<hash>.svg
    stackUrl: <basePath>/<group>.stack.<hash>.svg   # ADR-0006; only if the group has reference-dependent icons; naming ❓ Q-24
    icons: [<iconId>, ...]           # sorted
icons:
  <iconName>:
    sprite: <group>
    id: <iconId>
    viewBox: "0 0 24 24"
    color: mono | multicolor            # ADR-0004
    delivery: use | img | mask           # ADR-0006; field names fixed by TSK-004 (Q-05)
```

### 3. Types

- A sorted union, or an `as const` array, of all icon names ❓ Q-30 (shape, chosen after the TS perf spike)
- Per-namespace unions, if namespaces are enabled ❓ Q-30

### 4. Inline sprite (opt-in)

- The same symbols, emitted for embedding in HTML ❓ Q-25 (raw string vs framework component)

## Icon naming

- ❓ Q-31 Separator for namespaces (`social/github`, `social.github`, `social-github`)
- ❓ Q-32 Collision policy: error (default) vs. explicit alias map
- ❓ Q-31 Unicode and case normalization rules

## Adapter expectations (React)

- Reads the manifest at build time (through a generated module), never at runtime over the network
- Renders by the icon's `delivery` ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md)):
  - `use`: `<svg viewBox focusable="false"><use href="{url}#{id}"/></svg>`. `viewBox` on the consumer is optional, since the symbol's is enough;
  - `img` (multicolor with references): `<img src="{stackUrl}#{id}" alt="…">`;
  - `mask` (mono with references): an element masked by `url("{stackUrl}#{id}")` with `background-color: currentColor`
- Adds `aria-hidden="true"` unless a title or label is given; with a title it renders `role="img"` and a `<title>`
- Takes no part in SVG processing
