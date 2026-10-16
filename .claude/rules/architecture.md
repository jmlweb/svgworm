# Architecture rules

## Layers

```
SVG sources ─▶ core (parse, normalize, id, optimize, classify color, assemble)
                 │
                 ▼
          output contract (sprite files + manifest + types)   ◀── public API
                 │
                 ▼
          adapters (react, astro, …)  ── consume the contract only
```

- **Core** must not import or reference any UI framework.
- **Adapters** must not re-process SVGs. If an adapter needs data, add it to the output contract.
- The **output contract** (`docs/output-contract.md`) is a public API. Changing it needs an ADR and a semver note.
- The CLI is a thin shell over the core. Everything the CLI does should also be possible programmatically.

## Packages (ADR-0008)

- `packages/svgworm`: core in `src/core`, CLI in `src/cli`, optional Vite plugin in `src/vite` (`svgworm/vite`, ADR-0033; `vite` is an optional peer, not a dependency). `src/core` must not import `src/cli`, `src/vite`, `vite`, `@clack/prompts`, or `react`, and must not write to stdout. It reports progress through an event callback. `src/vite` uses only the core's public entry, never `src/cli`. Lint rules enforce this.
- `packages/react` (`@svgworm/react`): zero dependencies, `react` as a peer only, and no import from `svgworm`.
- Astro (ADR-0017), Vue and Svelte (ADR-0034): no package. `svgworm init` writes a dependency-free `Icon.astro`, `Icon.vue` or `Icon.svelte` from a template in `src/cli/init`; each must render the same markup as `@svgworm/react`. The conformance tests in `apps/site` (Astro) and `tests/conformance` (Vue, Svelte) fail on drift, so a change to the delivery logic touches all four.
- `apps/site` (private, ADR-0016): the landing page. It consumes the output contract like any user and is never published.
- At most 3 direct runtime dependencies in `svgworm`: svgo, zod, @clack/prompts. Prefer `node:` built-ins (`util.parseArgs`, `util.styleText`, `fs.glob`, `path.matchesGlob`, `fs.watch`, `crypto`).
- Sort with a code-unit comparator, never `localeCompare`. Convert `\` to `/` in every path from `fs.glob` before using it.

## Determinism

- Sort every collection before emitting (files, ids, attributes).
- Hashes come from content only, never from paths, mtimes, or absolute directories.
- Normalize path separators and Unicode (NFC/NFD) before deriving ids.
- Add a test that runs the same input twice in different orders and gets identical output.

## React adapter

- Components must be valid Server Components: no hooks, no `'use client'`, no context.
- Zero runtime dependencies beyond React itself.
- Accessible defaults: `aria-hidden` unless a title or label is given, and `focusable="false"`.
