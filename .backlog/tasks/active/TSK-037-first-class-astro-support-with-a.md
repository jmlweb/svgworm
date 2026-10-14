---
id: TSK-037
title: First-class Astro support with a generated Icon.astro
status: active
priority: P2
tags: []
created: 2026-10-14
source: idea/PLN-002
depends-on: []
started: 2026-10-14
---

# First-class Astro support with a generated Icon.astro

## Description

### Goal

Make svgworm as easy to set up in Astro as it is in Next.js. `svgworm init` detects an `astro` dependency and writes a React-free `src/components/Icon.astro`, typed with the generated `IconName`, that renders the same `use` / `img` / `mask` delivery as `@svgworm/react`. Docs, a CI-checked example, an agent skill, `llms.txt` and the README cover the Astro path the way they cover Next.js today.

### Context

- Today Astro works only the hard way. `apps/site` renders `@svgworm/react` through `react-dom/server` inside frontmatter, because `@astrojs/react` always emits a renderer client entrypoint, which left a 220 KB unreferenced React runtime in `dist/` (ADR-0016, TSK-036 progress log). That is no "easy" story for users.
- `svgworm init` only wires React/Next: `usesReact` is `deps.has('react') || deps.has('next')` (`packages/svgworm/src/cli/init/plan.ts`), and otherwise the component is skipped.
- Q-21 (how each framework serves the output dir) is answered for Next.js and plain HTML by ADR-0010. Vite and Astro were deferred to TSK-024. ADR-0010 notes the defaults (`public/icons`, `/icons`) already match Astro's `public/` convention, but this is unverified.
- Decided with the maintainer on 2026-10-14:
  - Mechanism: a generated `Icon.astro`, not a new `@svgworm/astro` package and not an `@astrojs/react` recipe.
  - Drift guard: a test renders the generated component and `createIcon` from the same fixture manifest and compares the markup.
  - Scope: `docs/astro.md`, `init` support, `skills/svgworm-astro/SKILL.md`, `llms.txt` and README.
  - Positioning: Next.js stays the lead story. Astro is "also supported" in the README, and the hero is unchanged.
  - Backlog: this covers Astro only. TSK-024 becomes "Vite recipe".
  - Dogfooding (2026-10-14): `apps/site` switches to the generated `Icon.astro` once TSK-036 closes.
  - Framework choice in `init` (2026-10-14): a new `--framework <react|astro>` flag, auto-detected by default. When both `react`/`next` and `astro` are dependencies, a TTY run asks with a clack select, and a non-TTY run without the flag picks Astro and says so in the output. A `--component-file` whose extension doesn't match the framework (`.astro` vs `.tsx`/`.jsx`) exits with code 2. Plain and `--json` output report the framework and its source (`flag` or `detected`). Rejected: inferring the framework from the `--component-file` extension (one flag doing two jobs), turning `--component` into an enum (breaks 0.1.0 `--component`/`--no-component`), and detection only (no override, a silent choice).
  - Baseline: Astro 7 only (principle 8).
  - `base`: `init` does not parse `astro.config.*`. The docs and the next steps say to pass `--public-path <base>/icons`.
- The output contract does not change. The generated component only reads the manifest, like any adapter.

### Approach

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
5. **Conformance test and `base` check (no `examples/astro`, decided 2026-10-15):** `apps/site` is the Astro proof, so a second Astro app would only duplicate its build, zero-JS check and CI. Put the conformance test in `apps/site` (it already depends on Astro). Verify once, in a throwaway build outside the repo, whether `public/` URLs get `base` added, and record the result in `docs/astro.md` and ADR-0017. The conformance test renders `Icon.astro` (Astro container API) and `createIcon` (`renderToStaticMarkup`) for each delivery form and compares the markup after normalizing attributes (LRN-027).
6. **CI:** no new job. `site:check` is the gate, and the conformance test runs with `pnpm test`.
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

### Review notes (2026-10-15)

- Also touch `packages/svgworm/src/cli/reporters/types.ts` (`framework`, `frameworkSource`) and put the extension-mismatch exit-2 tests in `args.test.ts` / `run.test.ts`.
- `context7.json`: add Astro wording to `rules` (no new folder).
- Step 10 (dogfood `apps/site`) waits for TSK-036 to close; branch from `main` after the site merges.
- Read LRN-018, LRN-027 (normalize React 19 preload in the conformance test), LRN-029 first.
- ADR-0017 states how the `--framework` flag surface is versioned.
- Split into implementation tasks before starting.

## Acceptance Criteria

- [x] ADR-0017 accepted: Astro support via an init-generated Icon.astro, resolves Q-21 for Astro — evidence: docs/adr/0017 Status accepted; Q-21 resolved for Astro (2026-10-14)
- [x] init plan tests cover Astro detection, scripts, base next steps, no overwrite, react+astro resolution, --framework override, extension mismatch exit 2, framework/frameworkSource in plan and --json — evidence: pnpm test → 30 files passed, 460 tests passed, 1 skipped (2026-10-14)
- [x] Dependency-free Icon.astro template typed with IconName, mirrors createIcon delivery (use/img/mask), a11y defaults, throws on unknown name and manifest version != 1 — evidence: pnpm vitest run --project site → 12 passed (Icon.astro vs createIcon) (2026-10-14)
- [x] init supports --framework <react|astro> with detection, TTY prompt when both detected, and reports framework and source in plain and --json output — evidence: pnpm test (run: init with Astro) + rtk proxy pnpm lint clean; TTY select prompt not run (2026-10-14)
- [x] Conformance test in apps/site: Icon.astro and createIcon render the same markup for use, img and mask — evidence: pnpm vitest run --project site → 12 passed (2026-10-14)
- [x] `base` handling for public/ verified in a throwaway build and recorded in docs/astro.md and ADR-0017 — evidence: manual: base section in docs/astro.md and ADR-0017 Evidence (2026-10-14)
- [x] docs/astro.md, docs/cli.md, README also-works line, llms.txt, context7.json, open-questions Q-21 updated — evidence: commits 2d8cc48 and 73307d9; pnpm test, lint, format:check, check:packages green (2026-10-14)
- [x] skills/svgworm-astro/SKILL.md added — evidence: commit 2d8cc48 adds skills/svgworm-astro/SKILL.md (2026-10-14)
- [x] Minor changeset for svgworm — evidence: .changeset/init-astro-framework.md (svgworm minor) (2026-10-14)
- [x] apps/site dogfoods the generated Icon.astro and drops React deps, site:check green (after TSK-036) — evidence: pnpm site:check → no client JS, 19 icon(s) from the hashed sprite; pnpm typecheck 0 errors (2026-10-14)
- [x] TSK-024 retitled to Vite recipe — evidence: flowstate task-update TSK-024 --set title; frontmatter reads Vite recipe (2026-10-14)

## Notes

## Learnings

## Progress Log

- [2026-10-14] Created
- [2026-10-14] Started
- [2026-10-14] ADR-0017 drafted, status proposed; accept after examples/astro confirms base handling.
- [2026-10-14] init --framework <react|astro>, Astro detection, generated Icon.astro, extension mismatch exit 2, framework/frameworkSource in plain/json/clack output. Tests first; lint, format, typecheck, tests green.
- [2026-10-14] Remaining: examples/astro + conformance test, CI job, docs, skill, changeset, apps/site dogfood, TSK-024 retitle, accept ADR.
- [2026-10-14] Dropped examples/astro and its CI job: apps/site is the Astro proof (site:check gate). Conformance test moves to apps/site; base handling checked in a throwaway build. Criteria 5 and 6 rewritten; ADR-0017 updated.
- [2026-10-14] apps/site renders with the generated Icon.astro (Landing/Install/Soil .astro); React kept as devDependencies for the conformance test only. Built HTML equals the old build apart from entity encoding.
- [2026-10-14] Conformance test found a bug: numeric width/height in the mask style lacked px. Fixed (f8a2e42).
- [2026-10-14] Throwaway build with base /docs: publicPath must include base. ADR-0017 accepted, Q-21 resolved for Astro.
- [2026-10-14] Remaining: docs/astro.md (incl. base result), README line, llms.txt, docs/cli.md, context7.json, skill, changeset wording, TSK-024 retitle.
- [2026-10-14] Docs, skill, changeset and TSK-024 retitle done (2d8cc48). All 11 criteria met; ready for complete-task.