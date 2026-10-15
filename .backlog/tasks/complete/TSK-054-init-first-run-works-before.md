---
id: TSK-054
title: Init: first run works before any icon exists
status: complete
priority: P1
tags: [init, onboarding, cli, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Init: first run works before any icon exists

## Description

Friction found by dogfooding 0.2.1 (2026-10-15). After `npx svgworm init --yes`, `npm run dev` fails in the predev hook with `svgworm: source folder not found: icons` (exit 2), and an empty folder fails with `build/no-icons`. The generated `src/components/icon.tsx` imports `../../svgworm/icons.js`, which does not exist until the first build, so the editor shows errors too. A new user's app is broken until they add icons. Reproduced in Next.js, Astro 7 and Vite 8.

## Acceptance Criteria

- [x] svgworm init creates the sources folder (default icons/) with one OSS-licensed sample icon when the folder is missing or empty — evidence: pnpm test (plan.test.ts sample icon, run.test.ts first run, sample-icon.test.ts) → 481 passed (2026-10-15)
- [x] init runs a first build so svgworm/icons.js exists and the generated Icon component type-checks immediately — evidence: run.test.ts 'leaves a project that builds before the user has any icon' → pass; manual: Next/Vite build with tsc and astro check → 0 errors (2026-10-15)
- [x] npm run dev and npm run build pass right after install + init in fresh Next.js, Astro and Vite apps (test or fixture-based check) — evidence: manual: packed tarballs in fresh create-next-app, create-astro, create-vite apps, init --yes then npm run build → exit 0 in all three, icon renders #i-svgworm (2026-10-15)
- [x] init never overwrites or adds a sample when the folder already has SVG files — evidence: pnpm test (run.test.ts 'adds no sample to a folder that has icons', plan.test.ts) → pass (2026-10-15)
- [x] Docs, llms.txt and both skills reflect the new first-run behavior — evidence: README.md get started, packages/svgworm/README.md, llms.txt 'How to use it', site docs cli#init / nextjs / astro, Landing.astro step 1, skills/svgworm-{nextjs,astro}/SKILL.md step 2-3 (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Implemented. `inspectProject` asks core `discoverSvgFiles` whether any source holds an SVG (a missing folder counts as empty). `planInit` then plans `<sources[0]>/svgworm.svg` (CC0, mono `currentColor`, in `src/cli/init/sample-icon.ts`) unless the config action is skipped. After `applyInit`, `init` runs one build from the config on disk (`src/cli/init/first-build.ts`) and exits like `svgworm`: 0 when it succeeds, 1 for invalid icons, 2 for a setup problem. The user chose that over exit 0 with a warning, and chose no `--no-sample`/`--no-build` flags. `--json` gains `build`. The next steps name the sample and show `<Icon name="svgworm" />`.
- [2026-10-15] Tests: plan (sample when the sources are missing or empty, none when they have icons, none when the config is skipped), sample icon compiles mono/use with no warnings, and run (init then build then check all exit 0; re-init idempotent; nested icons get no sample; an invalid SVG makes init exit 1 and `ok:false` in `--json`). New snapshots `plain-init.txt` and `json-init.json`. `pnpm verify` and `typecheck:ts7` pass.
- [2026-10-15] AC3 dogfood with packed 0.2.1 tarballs in fresh create-next-app, create-astro (minimal) and create-vite (react-ts) apps: `npx svgworm init --yes` exits 0 and writes `icons/svgworm.svg` and `svgworm/icons.{js,d.ts}`, and `npm run build` exits 0 in all three. Next and Vite (`tsc -b`) type-check the generated `icon.tsx` during the build. `predev` runs the same `svgworm` command as `prebuild`, so the dev hook is covered too. Then I rendered `<Icon name="svgworm" />` on each home page (`src/app/page.tsx`, `src/pages/index.astro`, `src/App.tsx`) and rebuilt. All three exit 0, and the output references `/icons/icons.1f1ab2b4.svg#i-svgworm` (Next prerendered HTML, Astro `dist/index.html`, Vite bundle). `astro check` (with @astrojs/check added) reports 0 errors. The repeatable check is the CLI test in `run.test.ts`; the framework check is this one-off manual run, with no CI matrix.
- [2026-10-15] Docs: README, landing step 1, packages/svgworm/README, llms.txt, site docs (cli, nextjs, astro) and both skills describe the sample and the first build. Changeset `.changeset/init-first-run.md` (svgworm minor).
- [2026-10-15] Completed
