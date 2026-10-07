# 0008. Tech stack and package layout

- **Status:** accepted
- **Date:** 2026-10-08
- **Task:** TSK-009
- **Resolves:** Q-40, Q-41, Q-42 (v0.1 part)

## Context

The design phase is closing (ADR-0004, ADR-0005), and v0.1 targets 2026-11-26. Before TSK-010 can scaffold anything, `.claude/rules/decisions.md` requires an ADR for the runtime, language target, build tool, test runner, SVG parser and optimizer, CLI framework, and config format. This ADR also settles:

- the package layout (Q-41);
- watch mode for v0.1 (Q-42);
- the CLI UX stack (principle 7, R-53);
- the supported version range (principle 8, R-54).

License and release tooling are in [ADR-0009](0009-license-versioning-and-release.md).

Forces:

- **Consumers pay for every dependency** (R-51, decisions.md). The closest competitor, @neodx/svg 1.1.1, installs 16 direct build-time dependencies (svgo, zod, commander, chokidar, jiti, unplugin, colord, fast-xml-parser, and its own `@neodx/*` packages).
- **Determinism on three OSes** (principle 2). Every library in the core path must give stable output, and the stack must make sorting and path normalization easy.
- **The core must not know about UI or React** (principle 3, architecture.md). The layout should enforce this, not just document it.
- **Agents drive the CLI** (principle 10, R-56): flags, `--json`, stable exit codes, and a JSON Schema for the config.
- **No bundler-plugin dependence** (ADR-0005, LRN-008). The TSK-007 spike showed a plugin breaking under Next 16 + Turbopack, while a prebuild script works.

All versions below were checked against the npm registry and nodejs.org on 2026-10-08.

## Options considered

### Runtime and supported versions

1. **Node.js only, with a floor at the oldest maintained LTS (22).** Node 22 is maintained until 2027-04-30, 24 is LTS until 2028-04-30, and 26 becomes LTS on 2026-10-28. Chosen.
2. **Node 24+ only.** Simpler, but it drops teams still on 22 for no API we need.
3. **Also support Bun and Deno.** This would add a test matrix with no evidence of demand. We won't block them, but we won't test them either.

### Language and module format

1. **TypeScript 6.0, strict, ESM-only.** Chosen. TypeScript 7.0.2 (the native compiler) is `latest`, but typescript-eslint 8.71.1 declares `typescript: ">=4.8.4 <6.1.0"`, because 7.0 ships no programmatic API ([typescript-eslint#12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518)). ESM-only is safe: `require(esm)` has been unflagged since Node 22.12, so CommonJS callers still work.
2. **TypeScript 7.0 now.** Faster type checks, but no type-aware linting. Revisit when typescript-eslint supports it (expected with TS 7.1).
3. **Dual ESM + CJS.** Twice the build output for no supported runtime that needs it.

### Build tool

1. **`tsc` only (no bundler).** It emits per-file ESM plus `.d.ts`. `rewriteRelativeImportExtensions` lets sources import `./x.ts`, so the same files run directly in Node through type stripping (on by default and warning-free since Node 22.18). Adds no dependency. Chosen.
2. **tsdown 0.23.** A capable bundler, but still pre-1.0. It brings 14 dependencies including rolldown, and its own engines floor is `^22.18.0 || ^24.11.0 || >=26`. A CLI and a small library don't need bundling.
3. **tsup 8.5.** Its README says it "is not actively maintained anymore" and points to tsdown. Rejected.

### Test runner

1. **Vitest 5.0.** Gives us everything `testing.md` asks for in one tool:
   - snapshots (`toMatchSnapshot`, file snapshots for the output contract);
   - type tests (`*.test-d.ts` with `expectTypeOf` / `@ts-expect-error`, run through `tsc`), so "an invalid icon name fails type-checking" becomes a test;
   - a browser mode, if the browser-check work wants it.

   Its engines are `^22.12.0 || ^24.0.0 || >=26.0.0`, which matches our range. Chosen.
2. **`node:test`.** Zero dependencies, and it has snapshots, but no type tests. We would need a second tool such as tsd.
3. **Jest.** Its ESM support is still experimental, and it has no type tests.

### SVG parser and optimizer

1. **svgo 4.1 for both.** Chosen.
   - Its plugin API exposes the full [xast](https://github.com/syntax-tree/xast) tree with enter/exit visitors.
   - The TSK-003 spike already built ADR-0004's classifier and rewrite on it: the `inlineStyles` preset plugin, a capture plugin for the tree, and a rewrite plugin.
   - `prefixIds` covers R-20. It is MIT and maintained (4.1.0, 2026-08).
2. **A separate XML parser** (fast-xml-parser, sax, or the xast/hast utils) **plus svgo** only for optimizing. The tree would be parsed twice with two tree shapes, and we would have to port inheritance-aware traversal that already works on svgo's tree.
3. **A custom optimizer.** Months of work that svgo has already done, for no gain.

### CLI framework

1. **`node:util.parseArgs`** plus a small subcommand dispatcher (`build`, `check`, `watch`, `init`) and hand-written help. Chosen.
   - Stable since Node 20, and `--no-` negation is supported since 22.4.
   - Adds no dependency.
   - The help text is ours, so it can be snapshot-tested and written for agents.
2. **commander 15.** Good and has no dependencies (207 kB), but we have about 10 flags and 4 subcommands. svgo already pulls in commander 11 for its own CLI. Using that copy would couple us to svgo's version.
3. **citty 0.2 / cac 7.** Pre-1.0 (citty), or no gain over `parseArgs` for this size.

### CLI UX stack (principle 7, R-53)

1. **`@clack/prompts` 1.8 for TTY interaction and progress, `node:util.styleText` for color, and our own plain/JSON reporters for everything else.** Chosen.
   - Clack provides `text`/`select`/`confirm` prompts (for `init`), `spinner`, `progress({ max })` with `advance()`, and `log`.
   - `styleText` has been stable since Node 22.13. It respects `isTTY`, `NO_COLOR`, `NODE_DISABLE_COLORS`, and `FORCE_COLOR` (since 22.8), so it replaces picocolors or chalk.
2. **ink.** It renders the terminal with React. Too heavy for a CLI whose core must stay framework-free.
3. **ora + inquirer/enquirer + chalk.** Three packages for what clack does in one.

### Config format

1. **`svgworm.config.json`** validated at runtime, with a published JSON Schema referenced through `$schema`. CLI flags override the file (R-32). Chosen.
   - Editors and agents validate and autocomplete it with no loader, and running it executes no code.
   - It is the format R-55 asks us to publish a schema for.
   - The ADR-0004 override rules (`{ match, color }`) are plain data.
2. **`svgworm.config.ts`.** Typed authoring, but it needs a loader (jiti, or Node type stripping, which is still "release candidate" on Node 22). It runs arbitrary code, and agents can't validate it statically.
3. **A `package.json` key.** One more place to look, and it can't carry `$schema`.

Validation library:

1. **zod 4.6.** Chosen.
   - One package with zero dependencies.
   - The same schema gives runtime validation with path-aware errors (R-52), the TypeScript config type, and the JSON Schema through the built-in `z.toJSONSchema()`.
   - Cost: 8.2 MB unpacked, because it ships its v3 and mini builds.
2. **valibot 1.5 + @valibot/to-json-schema.** About 2 MB in total, but two packages, and the JSON Schema converter is a separate, younger package.
3. **Hand-written validator plus a hand-written schema.** No dependency, but two sources of truth that will drift.

### Package layout (Q-41)

1. **pnpm workspace with two published packages:** `svgworm` (core + CLI) and `@svgworm/react` (adapter). Chosen.
   - The app imports the adapter at runtime, so it is a runtime dependency there, while `svgworm` stays a devDependency.
   - As a separate package, the adapter's zero-dependency rule (R-51) and its "consume the contract only" rule (ADR-0002) are enforced by `package.json`, not by convention.
2. **Single package with subpath exports** (`svgworm/react`). One thing to version, but the app would need `svgworm` as a production dependency to import the adapter. That puts svgo, zod, and clack into every production install (Docker `--prod`, Next standalone tracing).
3. **Three packages** (`@svgworm/core`, `svgworm` CLI, `@svgworm/react`). This splits core from CLI along the right line, but adds a third package to version and publish for a boundary that a lint rule can enforce inside one package.

### Watch mode (Q-42, v0.1 part)

1. **`node:fs.watch(dir, { recursive: true })`** with a debounce and a full rebuild (ADR-0005). Recursive watching works on Linux since Node 19.1, and on macOS and Windows before that. Adds no dependency. Chosen.
2. **chokidar 5.** Mature, with one dependency (readdirp). Kept as the fallback if TSK-013 finds that `fs.watch` misbehaves.

## Decision

### Stack

| Area | Choice | Version | Kind |
|------|--------|---------|------|
| Runtime | Node.js | engines `^22.20.0 \|\| >=24.11.0`; CI on 22, 24, 26 | – |
| Language | TypeScript, strict, ESM-only | 6.0.x (move to 7.x when typescript-eslint supports it) | dev |
| Build | `tsc` (no bundler) | same as language | dev |
| Test runner | Vitest (unit, snapshot, type tests) | 5.0.x | dev |
| SVG parser + optimizer | svgo (xast plugins, `preset-default`, `inlineStyles`, `prefixIds`) | 4.1.x | runtime |
| CLI args | `node:util.parseArgs` + own dispatcher | built-in | – |
| CLI UX | `@clack/prompts` (prompts, spinner, progress) + `node:util.styleText` (color) | 1.8.x | runtime |
| Config | `svgworm.config.json` + JSON Schema, validated with zod | zod 4.6.x | runtime |
| File discovery / globs | `fs.promises.glob`, `path.matchesGlob` | built-in (stable since 22.17 / 22.20) | – |
| Watch | `fs.watch` recursive, debounced full rebuild | built-in | – |
| Hashing | `node:crypto` (SHA-256 of content) | built-in | – |
| Package manager | pnpm workspace, pinned via `packageManager` | current major | dev |
| Lint / format | ESLint + typescript-eslint (`strictTypeChecked`) + Prettier | 10.x / 8.x / 3.x | dev |
| Package checks | publint + @arethetypeswrong/cli in CI | 0.3.x / 0.18.x | dev |

Why the engines floor sits where it does:

- **22.20** is where `path.matchesGlob` became stable.
- **24.11** aligns with the tooling floor (tsdown, Vitest, Changesets all use `^24.11` or `^24`). `matchesGlob` is stable from 24.8.
- Node 23 and 25 are end-of-life and are not supported, even though `>=24.11` doesn't exclude 25 syntactically.

Compiler settings:

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- `verbatimModuleSyntax`, `erasableSyntaxOnly` (so sources run under Node type stripping)
- `module: nodenext`, `rewriteRelativeImportExtensions`, `target: es2024`

### Supported version range for consumers (principle 8, R-54)

| Consumer side | Supported | Notes |
|---------------|-----------|-------|
| Node.js (runs the CLI) | 22.20+, 24.11+, 26+ | Drop a line when it reaches end-of-life (22 on 2027-04-30), in a minor release during 0.x |
| React (adapter peer) | `^19.0.0` | Server Components need React 19. Tested against the latest 19.x (19.3.0 today) |
| Next.js (documented path) | 16.x with Turbopack | Verified target (TSK-007 used 16.4.0). Older majors are not documented or tested |
| TypeScript (generated types) | 6.0+ and 7.x | Generated types are type-tested with both compilers in CI |
| Browsers (sprite rendering) | Current and previous major of Chrome/Edge, Firefox (plus current ESR), Safari | Baseline "widely available" features only. TSK-002 confirms gradients, masks, and the ADR-0004 rewrite in Chromium, Firefox, and WebKit |

### Package layout

```
packages/
  svgworm/        # npm "svgworm": core + CLI. bin: svgworm. exports: "." (programmatic API), "./config.schema.json"
    src/core/     # pure pipeline; no UI, no React, no process.stdout
    src/cli/      # thin shell: args, reporters, prompts
  react/          # npm "@svgworm/react": Icon component. peer: react ^19. zero dependencies
examples/
  next-app-router/  # private, not published (TSK-016)
```

- An ESLint `no-restricted-imports` rule stops `src/core/**` from importing `src/cli/**`, `@clack/prompts`, or `react`.
- The core reports progress through an event callback that the CLI's reporters consume. This is what keeps R-33 (programmatic API = CLI) honest.

### CLI behavior contract

- **Reporter selection:**
  - `--json`: one JSON document on stdout, nothing else on stdout.
  - Otherwise, a TTY and no `CI=true`: the clack reporter (animated progress, colored stats summary).
  - Otherwise: the plain reporter (one stable line per event, then the stats summary, no ANSI unless `FORCE_COLOR` is set).
  - Diagnostics go to stderr in every mode.
- **Interactive prompts** run only when stdin and stdout are both TTYs. Otherwise every prompt has a flag (R-56), and a missing required value exits with code 2 and a message that names the flag.
- **Exit codes:** `0` success; `1` build failed (invalid SVGs, collisions) or `check` found stale output; `2` usage or config error. They are documented and treated as public API.

### Dependency budget

- **`svgworm`: at most 3 direct runtime dependencies** (svgo, zod, @clack/prompts). A fourth needs a superseding ADR or an amendment that justifies it. Measured on 2026-10-08 with a clean `npm install` of exactly these three: 24 packages, 19.6 MB on disk. zod is 8.2 MB of that, and svgo with its css-tree/csso tree is about 7.5 MB.
  - Compare @neodx/svg: 16 direct dependencies.
  - It is a CLI, installed as a devDependency, so the size is paid once per install and never reaches the browser.
- **`@svgworm/react`: 0 dependencies**, with `react` as a peer (R-51).
- **Generated code** (manifest module, types) imports nothing from `svgworm` at runtime.
- **Dev dependencies are not budgeted**, but each new one must have a clear job. No overlapping tools: one test runner, one linter, one formatter.

## Evidence

- **Versions and maintenance,** checked against the npm registry on 2026-10-08:

  | Package | Version | Last published |
  |---------|---------|----------------|
  | svgo | 4.1.0 | 2026-08-24 |
  | zod | 4.6.5 | 2026-10-02 |
  | @clack/prompts | 1.8.1 | 2026-09-13 |
  | vitest | 5.0.3 | 2026-09-30 |
  | typescript | 7.0.2 (`latest`), 6.0.3 | 2026-10-07 |
  | typescript-eslint | 8.71.1 (peer `typescript <6.1.0`) | 2026-10-07 |
  | tsdown | 0.23.0 | 2026-09-03 |
  | tsup | 8.5.1 | 2025-11-12 |
  | commander | 15.0.0 | 2026-09-02 |
  | react | 19.3.0 | – |
  | next | 16.4.0 | – |

- **Node release schedule** ([nodejs/Release schedule.json](https://github.com/nodejs/Release/blob/main/schedule.json)): 22 maintained until 2027-04-30, 24 until 2028-04-30, 26 is LTS from 2026-10-28.
- **Node API stability**, from the v22.x and v24.x docs:
  - `util.parseArgs` is stable since v20.0.0;
  - `util.styleText` is stable since v22.13.0, and respects `NO_COLOR`/`FORCE_COLOR`/`isTTY` since v22.8.0;
  - `fsPromises.glob` is stable since v22.17.0;
  - `path.matchesGlob` is stable since v22.20.0 and v24.8.0;
  - `fs.watch` recursive works on Linux since v19.1.0;
  - type stripping is on by default and warning-free since v22.18.0, but still "Stability 1.2, release candidate".
- **tsup:** its [README](https://github.com/egoist/tsup) says it is not actively maintained and recommends tsdown.
- **TS 7 and typescript-eslint:** typescript-eslint 8.71.1 has the peer range `>=4.8.4 <6.1.0`; [issue #12518](https://github.com/typescript-eslint/typescript-eslint/issues/12518) reports the install conflict and crash.
- **svgo:**
  - The [TSK-003 spike](../../spikes/TSK-003-color-classification/RESULTS.md) used svgo 4.1.0 for the whole ADR-0004 pipeline on 31,390 icons. Over 21,667 rewrites, no correctness issue came from svgo.
  - Benchmark (2026-10-08, Node 24.13, Apple Silicon laptop): parsing plus a multipass `preset-default` + `prefixIds` optimization of 1,000 icons, cycling the 27 valid `fixtures/` files, took **1.44 s**. Two runs gave byte-identical output. That is within R-50 ("1,000 icons in a few seconds") before any caching.
- **Vitest:** the [v5.0.3 docs](https://github.com/vitest-dev/vitest/blob/v5.0.3/docs/guide/testing-types.md) cover type tests with `expectTypeOf` and `assertType` in `*.test-d.ts`, checked by `tsc`.
- **Clack:** the [README](https://github.com/bombshell-dev/clack/blob/main/packages/prompts/README.md) documents `progress({ max })` with `advance`, `spinner`, `tasks`, and `taskLog`. Its source treats `CI=true` and non-TTY output by printing lines instead of redrawing. We still pick the reporter ourselves, so we don't rely on that.
- **zod:** the [v4.6.5 docs](https://github.com/colinhacks/zod/blob/v4.6.5/packages/docs/content/json-schema.mdx) cover `z.toJSONSchema(schema)`.
- **Footprint:** measured with a scratch `npm install --ignore-scripts svgo@4.1.0 zod@4.6.5 @clack/prompts@1.8.1` (24 packages, 19,556 kB). @neodx/svg's 16 direct dependencies come from `npm view @neodx/svg dependencies`.
- **Bundler plugins:** the [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md) found a webpack plugin failing under Next 16 + Turbopack while a prebuild script worked, which supports a plain CLI with no plugin.

## Consequences

- **TSK-010** can scaffold: a pnpm workspace with the two packages, `tsc` builds, Vitest (unit, snapshot, type tests), ESLint + Prettier, publint + attw, and CI on Linux, macOS, and Windows × Node 22, 24, 26.
- **Type tests:** generated types are type-tested with both TypeScript 6 and 7 in CI. The repo's own toolchain stays on 6.0 until typescript-eslint supports 7. That is a follow-up check, not a new task, unless it slips past TS 7.1.
- **Single owner of the SVG tree:** svgo is now the only owner of the SVG tree. Getting the tree means a capture plugin, because svgo has no public `parse` export. That is a documented plugin API, but any major svgo upgrade needs the full contract snapshot suite to pass.
- **Platform differences the core must normalize:** path separators from `fs.glob` on Windows, Unicode (NFC), and sort order (compare code units, never `localeCompare`). The determinism test covers all three.
- **Config:** the JSON Schema is generated from the zod schema at build time and shipped in the package (`svgworm/config.schema.json`). A snapshot test catches drift.
- **Watch:** the v0.1 watch is a full rebuild. Network filesystems and Docker bind mounts can make `fs.watch` unreliable, so the docs must say so. If TSK-013 confirms problems, switch to chokidar 5 (an amendment within the budget, since it replaces nothing in the 3).
- **Incremental watch and cache (Q-42, post-v0.1, TSK-023):** when it comes, key the cache by SHA-256 of the file bytes + resolved config + svgworm version. That is content only, per architecture.md.
- **Two packages need two names on npm:** `svgworm` (free on 2026-10-08) and the `@svgworm` scope, which needs an npm org. See ADR-0009 for release, and the TSK-018 checklist.
- **Clack 1.x is pre-2.0 but stable-numbered.** If it breaks the API, only the TTY reporter is affected, because the plain and JSON reporters don't use it.
