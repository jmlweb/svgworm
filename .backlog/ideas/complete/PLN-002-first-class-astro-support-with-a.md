---
id: PLN-002
title: First-class Astro support with a generated Icon.astro
status: approved
created: 2026-10-14
complexity: high
reviewed: 2026-10-14
task-id: TSK-037
---


## Goal

Make svgworm as easy to set up in Astro as it is in Next.js. `svgworm init` detects an `astro` dependency and writes a React-free `src/components/Icon.astro`, typed with the generated `IconName`, that renders the same `use` / `img` / `mask` delivery as `@svgworm/react`. Docs, a CI-checked example, an agent skill, `llms.txt` and the README cover the Astro path the way they cover Next.js today.

## Context

- Today Astro works only the hard way. `apps/site` renders `@svgworm/react` through `react-dom/server` inside frontmatter, because `@astrojs/react` always emits a renderer client entrypoint, which left a 220 KB unreferenced React runtime in `dist/` (ADR-0016, TSK-036 progress log). That is no "easy" story for users.
- `svgworm init` only wires React/Next: `usesReact` is `deps.has('react') || deps.has('next')` (`packages/svgworm/src/cli/init/plan.ts`), and otherwise the component is skipped.
- Q-21 (how each framework serves the output dir) is answered for Next.js and plain HTML by ADR-0010. Vite and Astro were deferred to TSK-024. ADR-0010 notes the defaults (`public/icons`, `/icons`) already match Astro's `public/` convention, but this is unverified.
- Decided with the maintainer on 2026-10-14:
  - Mechanism: a generated `Icon.astro`, not a new `@svgworm/astro` package and not an `@astrojs/react` recipe.
  - Drift guard: a test renders the generated component and `createIcon` from the same fixture manifest and compares the markup.
  - Scope: `docs/astro.md`, `examples/astro` with a zero-client-JS CI check, `init` support, `skills/svgworm-astro/SKILL.md`, `llms.txt` and README.
  - Positioning: Next.js stays the lead story. Astro is "also supported" in the README, and the hero is unchanged.
  - Backlog: this covers Astro only. TSK-024 becomes "Vite recipe".
  - Dogfooding (2026-10-14): `apps/site` switches to the generated `Icon.astro` once TSK-036 closes.
  - Framework choice in `init` (2026-10-14): a new `--framework <react|astro>` flag, auto-detected by default. When both `react`/`next` and `astro` are dependencies, a TTY run asks with a clack select, and a non-TTY run without the flag picks Astro and says so in the output. A `--component-file` whose extension doesn't match the framework (`.astro` vs `.tsx`/`.jsx`) exits with code 2. Plain and `--json` output report the framework and its source (`flag` or `detected`). Rejected: inferring the framework from the `--component-file` extension (one flag doing two jobs), turning `--component` into an enum (breaks 0.1.0 `--component`/`--no-component`), and detection only (no override, a silent choice).
  - Baseline: Astro 7 only (principle 8).
  - `base`: `init` does not parse `astro.config.*`. The docs and the next steps say to pass `--public-path <base>/icons`.
- The output contract does not change. The generated component only reads the manifest, like any adapter.

## Approach

1. **ADR-0017 (proposed, then accepted):** Astro support through an `init`-generated `Icon.astro`. Options: generated component, `@svgworm/astro` package, or an `@astrojs/react` recipe. Evidence: the ADR-0016 client-runtime leak and the Astro docs via Context7 (component props typing, `public/` serving, `base`, the container API for tests). It resolves Q-21 for Astro and keeps Vite in TSK-024.
2. **Test first:** add `init` plan tests for an Astro project:
   - an `astro` dependency writes `src/components/Icon.astro`;
   - `predev`/`prebuild` scripts are added;
   - next steps mention `--public-path` when `base` is used;
   - an existing differing file is never overwritten;
   - `react` + `astro` together: non-TTY picks Astro and reports `detected`, and `--framework react` overrides it;
   - `--framework astro --component-file x.tsx` (and the reverse) exits with code 2;
   - the plan and `--json` output carry `framework` and `frameworkSource`.
3. **Component template:** a dependency-free `Icon.astro` that imports `manifest` and `IconName` from the configured `moduleDir`. Props are `name: IconName`, `title?`, `label?` and pass-through SVG/HTML attributes. Defaults are `1em` size, `aria-hidden` unless `title` or `label` is set, and `focusable="false"`. It throws on an unknown name and on a manifest `version` other than 1. Delivery logic mirrors `packages/react/src/create-icon.tsx`.
4. **`init` detection and `--framework`:** add `--framework <react|astro>` to `args.ts` (a const map, validated, exit 2 on unknown values). Extend the facts with `usesAstro`. Resolve the framework from flag, then prompt (TTY, both detected), then detection. Pick the component file (`src/components/Icon.astro`) and its content by framework. The AGENTS.md section and the next steps name the Astro import.
5. **`examples/astro`:** Astro 7, `output: 'static'`, Lucide icons, `predev`/`prebuild`, committed `public/icons/` and `svgworm/`. Add a `check-output` script (no `<script>`, no `.js` in `dist/`, every icon from the hashed sprite) modelled on `apps/site/scripts/check-output.mjs`. Add a conformance test that renders `Icon.astro` (Astro container API) and `createIcon` (`renderToStaticMarkup`) for each delivery form and compares the markup after normalizing attributes.
6. **Root scripts and CI:** add `example:astro:build` / `example:astro:check`, kept out of `verify` like `example:*`, and a CI job next to the Next.js example job.
7. **Docs:**
   - `docs/astro.md`: steps, `base` mapped to `publicPath`, a cache-header table for Cloudflare/Netlify `_headers` and `vercel.json`, and `svgworm watch` alongside `astro dev`.
   - README: an "Also works with Astro" line and link.
   - `llms.txt` and `docs/cli.md`: `init` detects Astro.
   - `apps/site/`: switch to the generated `Icon.astro`, port `src/components/landing.tsx` to `.astro`, drop the React dependencies and `src/components/icon.tsx`; update its README and `package.json` description
- `docs/open-questions.md`: Q-21 resolved for Astro, with a link to ADR-0017.
8. **Skill:** `skills/svgworm-astro/SKILL.md`, mirroring `svgworm-nextjs` (install, `init --yes --agents-md`, build, render, cache, CI check, error table).
9. **Changeset:** a minor for `svgworm`, because `init` gains Astro support. No adapter change.
10. **Dogfood in `apps/site`** (after TSK-036 closes): run `svgworm init` there to generate `src/components/Icon.astro`. Render the landing page with it. Drop `react`, `react-dom`, `@types/react*`, `@svgworm/react`, `src/components/icon.tsx` and the `renderToStaticMarkup` call. Port `landing.tsx` to `.astro` components. `site:check` must stay green, and the ADR-0016 note on `react-dom/server` gets a follow-up in ADR-0017.
11. **Backlog:** retitle TSK-024 to "Vite recipe" with flowstate. Split implementation tasks out of this idea on approval.

## Files to Modify

- `docs/adr/0017-astro-support-generated-icon-component.md`: new ADR (options, evidence, decision)
- `packages/svgworm/src/cli/init/plan.ts`: `usesAstro` detection, Astro component path and content, scripts, next steps, AGENTS.md section
- `packages/svgworm/src/cli/init/plan.test.ts`: Astro project cases
- `packages/svgworm/src/cli/init/astro-component.ts`: new, the `Icon.astro` template as a string (keeps `plan.ts` readable)
- `packages/svgworm/src/cli/args.ts` / `args.test.ts`: `--framework` flag, validation, and the extension mismatch check
- `packages/svgworm/src/cli/init/prompts.ts`: framework select when both are detected, framework-aware component prompt wording
- `packages/svgworm/src/cli/reporters/`: plain and `--json` init output report `framework` and `frameworkSource`, with updated snapshots
- `packages/svgworm/src/cli/help.ts`: `init` help lists `--framework` and mentions Astro
- `examples/astro/`: new example (package.json, astro.config.ts, tsconfig, icons/, src/pages, src/components/Icon.astro generated by init, svgworm.config.json, scripts/check-output.mjs, conformance test, LICENSES.md, README)
- `package.json`: `example:astro:build` / `example:astro:check` scripts
- `.github/workflows/ci.yml`: Astro example job
- `oxlint.config.ts` / `oxfmt.config.ts`: ignore `examples/astro/{dist,.astro}/` if the existing globs miss them
- `docs/astro.md`: new setup guide
- `docs/cli.md`: `init` Astro behaviour and the `--framework` flag
- `skills/svgworm-nextjs/SKILL.md`: mention `--framework react` for Next apps that also depend on `astro` (rare; one line)
- `apps/site/`: switch to the generated `Icon.astro`, port `src/components/landing.tsx` to `.astro`, drop the React dependencies and `src/components/icon.tsx`; update its README and `package.json` description
- `docs/open-questions.md`: Q-21 resolved for Astro
- `README.md`: "also works with Astro" link, Next.js still the lead
- `llms.txt`: Astro path, synced with the README and `docs/cli.md`
- `skills/svgworm-astro/SKILL.md`: new agent skill
- `context7.json`: include `docs/astro.md` if the file lists docs explicitly
- `.changeset/*.md`: minor for `svgworm`

## Risks & Considerations

- **Drift between `Icon.astro` and `createIcon`.** Two renderers of one contract. The conformance test in the example is the guard. Any delivery change in the React adapter must update the template in the same change.
- **Generated code is user-owned.** Once `init` writes `Icon.astro`, later fixes don't reach users automatically. Keep the template small. Mark the file with its svgworm version so `init` can report an outdated component; re-running `init` never overwrites a differing file.
- **Typing in `.astro`.** `Props` must narrow `name` to `IconName` so `astro check` rejects an invalid name. Prove it with a negative type test in the example (an invalid name fails `astro check`).
- **Positioning.** TSK-024 deferred Astro to keep the Next.js story focused. Keep the README hero and the outreach copy Next-first.
- **Adoption window.** This competes with outreach work before the 2027-01-05 kill-criteria review. It is justified only if Astro widens the funnel. Track it in `docs/traction.md` if adopted.
- **`init` with both `react` and `astro`.** Astro is the non-TTY default (Astro projects often add React islands), announced in the output, never silent. `--framework react` overrides it.
- **New CLI surface.** `--framework` is public from its first release. Keep the values a closed set and reject unknown ones, so `vue`/`svelte` can be added later without a breaking change.
- **Astro container API stability.** If it is still experimental in Astro 7, pin it in the example only. It is a dev-time test, not product code.
