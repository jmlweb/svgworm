# Architecture rules

## Layers

```
SVG sources ─▶ core (parse, normalize, id, optimize, classify color, assemble)
                 │
                 ▼
          output contract (sprite files + manifest + types)   ◀── public API
                 │
                 ▼
          adapters (react, …)  ── consume the contract only
```

- **Core** must not import or reference any UI framework.
- **Adapters** must not re-process SVGs. If an adapter needs data, add it to the output contract.
- The **output contract** (`docs/output-contract.md`) is a public API. Changing it needs an ADR and a semver note.
- The CLI is a thin shell over the core. Everything the CLI does should also be possible programmatically.

## Determinism

- Sort every collection before emitting (files, ids, attributes).
- Hashes come from content only, never from paths, mtimes, or absolute directories.
- Normalize path separators and Unicode (NFC/NFD) before deriving ids.
- Add a test that runs the same input twice in different orders and gets identical output.

## React adapter

- Components must be valid Server Components: no hooks, no `'use client'`, no context.
- Zero runtime dependencies beyond React itself.
- Accessible defaults: `aria-hidden` unless a title or label is given, and `focusable="false"`.
