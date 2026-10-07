# Output contract (DRAFT)

> This draft is **not final**. Items marked ❓ are tracked in [open-questions.md](open-questions.md). Once accepted, the contract is a public API, and changes need an ADR and a semver note.

The output contract is the boundary between the core and the adapters. Adapters may only read what is listed here.

## Generated artifacts

### 1. Sprite file(s)

- One SVG file per sprite group, named `<group>.<contentHash>.svg` ❓ (naming scheme and hash length)
- Contains one `<symbol id="<iconId>" viewBox="…">` per icon
- Must not contain scripts or external references
- Internal ids (gradients, masks, clip paths) are prefixed per icon so they can't collide

### 2. Manifest

Machine-readable, language-neutral. ❓ Format (JSON plus a generated module?)

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
    color: mono | multicolor | stroke   ❓ (classification set)
```

### 3. Types

- A sorted union, or an `as const` array, of all icon names ❓ (shape, chosen after the TS perf spike)
- Per-namespace unions, if namespaces are enabled ❓

### 4. Inline sprite (opt-in)

- The same symbols, emitted for embedding in HTML ❓ (raw string vs framework component)

## Icon naming

❓ Separator for namespaces (`social/github`, `social.github`, `social-github`)
❓ Collision policy: error (default) vs. explicit alias map
❓ Unicode and case normalization rules

## Adapter expectations (React)

- Reads the manifest at build time (through a generated module), never at runtime over the network
- Renders `<svg viewBox aria-hidden focusable="false"><use href="{url}#{id}"/></svg>`
- Takes no part in SVG processing
