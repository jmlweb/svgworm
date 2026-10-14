# 0017. Astro support through an init-generated Icon.astro

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-037
- **Resolves:** Q-21 for Astro (Vite stays in TSK-024)

## Context

Astro works today only the hard way. `apps/site` renders `@svgworm/react` through `react-dom/server` inside frontmatter, because `@astrojs/react` always emits a client renderer entrypoint, which left a 220 KB unreferenced React runtime in `dist/` (ADR-0016, LRN-033). `svgworm init` wires only React and Next.js: with no `react` or `next` dependency it skips the component.

Principles 3 and 4 still apply: the core stays framework-agnostic, and icon names must be checked at compile time. The output contract does not change; any adapter only reads the manifest.

## Options considered

1. **Generated `Icon.astro`** (written by `svgworm init`): no new package and no React. Types come from the generated `IconName`. Cost: the delivery logic exists twice (React adapter and template), so drift needs a guard.
2. **`@svgworm/astro` package**: one maintained implementation, but a new published package with its own release surface and an Astro peer range, for a component of about 60 lines.
3. **`@astrojs/react` recipe**: no new code, but it keeps the unused client runtime in `dist/` and breaks zero-JS for static sites.

## Decision

Option 1. `svgworm init` generates `src/components/Icon.astro` (or `components/Icon.astro`), dependency-free, typed with the generated `IconName`, with the same `use` / `img` / `mask` delivery, accessibility defaults and errors as `createIcon`.

- **Framework selection:** `init --framework <react|astro>`. Auto-detected from dependencies by default. When both are present, a TTY run asks (clack select) and a non-TTY run without the flag picks Astro and says so. Plain and `--json` output report `framework` and `frameworkSource` (`flag` or `detected`).
- **Extension mismatch:** `--component-file` with an extension that doesn't match the framework (`.astro` vs `.tsx`/`.jsx`) exits with code 2.
- **Drift guard:** a conformance test renders the generated component (Astro container API) and `createIcon` (`renderToStaticMarkup`) from the same fixture manifest, and compares the markup after normalizing attribute order and the React 19 preload hint (LRN-027).
- **`base`:** `init` does not parse `astro.config.*`. Docs and next steps say to pass `--public-path <base>/icons` (LRN-018 applies the same way).
- **Baseline:** Astro 7 only (principle 8).
- **Flag surface versioning:** `--framework` is additive. The values `react` and `astro` are part of the CLI contract; a new value is a minor, a removed one needs an ADR. `--component` and `--no-component` keep their 0.1.0 meaning.
- **Rejected:** inferring the framework from the `--component-file` extension (one flag, two jobs), turning `--component` into an enum (breaks 0.1.0), detection without an override (a silent choice).

## Evidence

- ADR-0016 and LRN-033: the `@astrojs/react` client entrypoint leaks a React runtime into a static build.
- Astro docs (Context7, `/withastro/docs`): component props typing with `HTMLAttributes` from `astro/types`; `public/` files are copied untouched and referenced by URL path; `experimental_AstroContainer.renderToString` renders a component for tests.
- ADR-0010: the default `public/icons` and `/icons` already match Astro's `public/` convention. 
- Throwaway build of `apps/site` with `base: '/docs'` (2026-10-15, Astro 7.3.5): `public/` is copied to the `dist/` root and the sprite URLs svgworm wrote (`/icons/icons.<hash>.svg#…`) are left as they are, so with `base` they 404 (`/docs/icons/…` is where the host serves the file). `publicPath` must include `base`, like Next.js `basePath` in LRN-018. `init` therefore does not parse `astro.config.*` and says so in its next steps.

## Consequences

- The Astro path costs one `init` run and no extra dependency.
- A conformance test caught a real drift while this was built: a numeric `width` in the `mask` style was missing its `px`. The test belongs to the template's definition of done.
- The template and `createIcon` must change together; the conformance test fails on drift.
- `apps/site` can drop React and `react-dom` once it uses the generated component. ADR-0016's `react-dom/server` note gets this follow-up.
- No `examples/astro`: `apps/site` is the Astro proof, gated by `site:check`, and holds the conformance test.
- Follow-ups: `docs/astro.md`, `skills/svgworm-astro/SKILL.md`, TSK-024 narrowed to a Vite recipe.
