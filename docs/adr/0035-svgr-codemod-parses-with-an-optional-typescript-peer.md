# 0035. SVGR codemod parses with an optional TypeScript peer

- **Status:** accepted
- **Date:** 2026-10-18
- **Task:** TSK-093
- **Resolves:** none

## Context

SVGR is the largest pool of possible switchers (21.6M weekly downloads for `@svgr/core`, `apps/site/src/content/docs/comparison.md`). Its users import each SVG as a component (`import Logo from './logo.svg'`, `import { ReactComponent as Logo } from './logo.svg'`, `import Logo from './logo.svg?react'`), in files spread across the repo. `sources` globs (ADR-0020) already collect the files. What costs a switcher is rewriting every import and every JSX use into `<Icon name="…" />`.

A codemod has to parse JS, JSX, TS and TSX, and find each reference to an import binding. A regex cannot do that safely: comments, strings, template literals, TSX generics and shadowed locals would all give wrong rewrites. The `svgworm` package cannot take a parser as a runtime dependency. ADR-0008 caps it at 3 (svgo, zod, @clack/prompts), and the cap is full.

The TypeScript compiler API parses all four languages and has a type checker that resolves references by symbol. Almost every React project already has it installed. TypeScript 7 changes this. The published `typescript@7.0.2` exports only `version` from its main entry, plus `./unstable/*` IPC APIs (`sync`, `async`, `ast`), so there is no `createSourceFile` or `createProgram`. TypeScript 5 and 6 have both.

## Options considered

1. **An optional peer `typescript`**, loaded at run time from the project, then from next to svgworm. The command is `svgworm migrate svgr`. Pros: no runtime dependency, and the ADR-0008 cap is unchanged. It follows the `vite` peer from ADR-0033. The type checker finds references by symbol. Cons: a project with only TypeScript 7, or with no TypeScript at all, has to run it with `npx -p typescript@6 -p svgworm svgworm migrate svgr`. A later TypeScript 7 port would target an unstable API.
2. **A separate `@svgworm/migrate` package** with `typescript` as a regular dependency. Pros: always works. Cons: a new npm package needs a manual first publish and trusted-publisher setup that only the maintainer can do (LRN-032, ADR-0033 option 2), plus another changelog and release tag. All of that for a command most users run once.
3. **A hand-written scanner** for import declarations and JSX tag names. Pros: no dependency at all. Cons: it is fragile in exactly the cases above. To stay safe it would list many valid imports as unconvertible, and that defeats the point of a codemod.

## Decision

Option 1.

- **Packaging.** `typescript` is a peer `>=5.0.0`, marked optional in `peerDependenciesMeta`. The range has no upper bound: an optional peer is still range-checked when the package is installed, and `npm install` of svgworm with `<7` in a project on `typescript@7.0.2` failed with `ERESOLVE` (2026-10-18). TypeScript 7 is rejected at run time instead. It is a dev dependency at `6.0.3`, the workspace version. Only `import type` statements reach the published code, so no public type depends on it.
- **Loading.** `loadTypeScript(cwd)` resolves `typescript` from `<cwd>/package.json` first, so the project's version wins, and then from svgworm's own location, which covers `npx -p typescript@6`. It accepts a module only when it has `createSourceFile`. That check rejects TypeScript 7. If nothing loads, the command exits 2 and prints the `npx -p typescript@6 -p svgworm …` line.
- **Placement.** The codemod knows JSX, so it lives in `src/cli/migrate`, not in the framework-agnostic core. Names still come from the core's `discoverSvgFiles` and `deriveName`, so an import maps to the exact name `build` writes. Invalid icons and name collisions come from `compileFromDisk`.
- **Rewriting.** One `createProgram` over the files that mention `.svg`, with `noLib` and `noResolve`, so references are found by symbol and a shadowing local is left alone. Each edit splices text by offset. The AST is never reprinted, so formatting is kept.
- **Contract.** A dry run is the default and `--write` applies the changes. Exit 0 means every SVGR import converted. Exit 1 means some imports were left on SVGR: each one is listed with `file:line` and a reason, and its file is not touched. Exit 2 means a usage or config error, a missing Icon component, or no usable TypeScript.

## Evidence

- `typescript@7.0.2` from npm (`npm pack`, 2026-10-18): the `exports` map has `"."` pointing to `./lib/version.cjs` and `./unstable/{sync,async,fs,proto,ast,…}`. No entry exposes the compiler API.
- Tests: `packages/svgworm/src/cli/migrate/svgr.test.ts` covers the transform: default, `ReactComponent as`, `?react`, a mixed URL and component import, a reused Icon import, shadowing, and each unconvertible case. `packages/svgworm/src/cli/migrate.test.ts` runs the CLI on a fixture project with a `@/*` tsconfig path. It snapshots the dry run, `--json` and the `--write` output, and checks that `--write` is idempotent and that a missing TypeScript exits 2.
- A real CRA app, tilt-dev/tilt `web/` at `2f0d1d1` (42 SVGs in `src/assets/svg`, 54 `.svg` imports, `ReactComponent as` style), run with `typescript@6.0.3` loaded from next to svgworm, since the clone had no `node_modules`. Result: 25 uses in 12 files rewritten, and 30 imports left with reasons:
  - 20 used as values, mostly `styled(Svg)`;
  - 9 with a `fill` prop;
  - 1 in a file that already defines `Icon`.

  No file outside those 12 changed.

## Consequences

- An SVGR user switches with one command and a list of what is left. `styled(Svg)` wrappers and color props need a person, and the list names the icon to use (`rewrite it by hand with <Icon name="close" />`).
- **Spread props convert.** `<Logo {...props} />` becomes `<Icon name="logo" {...props} />`. TypeScript does not check excess keys in a JSX spread, so a `ref`, `children`, `fill` or `stroke` inside the spread passes silently. The codemod refuses those props only when they are written out. Spreads are common in real code (tilt's `{...props}`), and refusing them would leave most wrapper components on SVGR.
- **Not detected:** `require('./x.svg')`, `import('./x.svg')` and `export * from './x.svg'`. Exit 0 does not prove that SVGR is gone. The guide says to search for these before removing the loader.
- Projects on TypeScript 7 only, and plain JS projects, need the `npx -p typescript@6` form until a port to TypeScript 7's API. That port waits until the API is stable, like TSK-034.
- The codemod does not run a formatter. Users run their own formatter on the changed files.
- Other migrations (`migrate <tool>`) would reuse the loader and the `migrate` command. Each one needs its own task.
