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

- ❓ Q-31 Separator for namespaces (`social/github`, `social.github`, `social-github`)
- ❓ Q-32 Collision policy: error (default) vs. explicit alias map
- ❓ Q-31 Unicode and case normalization rules

## Adapter expectations (React)

- Reads the manifest at build time (through a generated module), never at runtime over the network
- Renders `<svg viewBox focusable="false"><use href="{url}#{id}"/></svg>`
- Adds `aria-hidden="true"` unless a title or label is given; with a title it renders `role="img"` and a `<title>`
- Takes no part in SVG processing
