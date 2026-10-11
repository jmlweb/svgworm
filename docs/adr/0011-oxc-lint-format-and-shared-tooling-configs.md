# 0011. Lint and format with Oxlint and Oxfmt, on the shared @jmlweb configs

- **Status:** accepted
- **Date:** 2026-10-11
- **Task:** TSK-010
- **Resolves:** none. Supersedes only the "Lint / format" row of the stack table in [ADR-0008](0008-tech-stack-and-package-layout.md) (ESLint + typescript-eslint + Prettier). The rest of ADR-0008 stays in force, and ADR-0008 itself is not edited.

## Context

ADR-0008 picked ESLint 10 + typescript-eslint `strictTypeChecked` + Prettier. It also kept the repo on TypeScript 6 because typescript-eslint declares `typescript: ">=4.8.4 <6.1.0"` and TypeScript 7 ships no programmatic API.

The owner maintains shared tooling packages ([jmlweb/tooling](https://github.com/jmlweb/tooling)) and wants every tool they cover to come from them. The tooling repo recommends Oxlint and Oxfmt for new projects and has put its ESLint and Prettier configs in maintenance mode (dependency and security updates only, no new rules). Choosing a linter or formatter needs an ADR (`.claude/rules/decisions.md`).

## Options considered

1. **Keep ESLint + typescript-eslint + Prettier** with hand-written configs. Works today and is what the scaffold had. But it ignores the owner's shared packages, and the `@jmlweb/*` ESLint and Prettier configs get no new rules.
2. **`@jmlweb/eslint-config-*` + `@jmlweb/prettier-config-base`.** Shared, but in maintenance mode and still tied to the TypeScript API and its `<6.1.0` peer range.
3. **Oxlint + Oxfmt via `@jmlweb/oxlint-config-*` and `@jmlweb/oxfmt-config-base`.** Chosen. Fast, shared, and type-aware rules run through `oxlint-tsgolint`, which does not use the TypeScript JS API.

## Decision

Replace the lint/format row of ADR-0008 with Oxlint and Oxfmt, and take every tool the `@jmlweb` packages cover from them:

| Area | Package |
|------|---------|
| Lint, `svgworm` (core + CLI) | `@jmlweb/oxlint-config-node`, `options.typeAware: true` in the root `oxlint.config.ts` |
| Lint, `@svgworm/react` | `@jmlweb/oxlint-config-react` in `packages/react/oxlint.config.ts` |
| Format | `@jmlweb/oxfmt-config-base` in `oxfmt.config.ts` |
| TypeScript | `@jmlweb/tsconfig-node` via `tsconfig.base.json` (no `tsconfig-react`: its `moduleResolution: bundler` is wrong for a published package; `packages/react` adds only `jsx: react-jsx`) |
| Tests | `@jmlweb/vitest-config` spread into each Vitest project |
| Commits | `@jmlweb/commitlint-config`, run by a husky `commit-msg` hook and in CI |

Details:

- **TypeScript stays on 6.0** for builds and type checks. The blocker named in ADR-0008 (typescript-eslint needs the TypeScript API) is gone: type-aware linting now runs on `oxlint-tsgolint`, which targets typescript-go. Moving the repo to TypeScript 7 is a follow-up, to be revisited at TS 7.1, and is not part of this decision. `typecheck:ts7` keeps type-checking with TS 7 in CI.
- **The root tsconfig keeps stricter or newer options** on top of the shared one, which only provides ES2022: `target`/`lib` `es2024`, `erasableSyntaxOnly`, `rewriteRelativeImportExtensions`, `types: ["node"]`.
- **Formatting style changes** from the Prettier style (no semicolons, width 100) to the Oxfmt config's (semicolons, single quotes, width 80, sorted imports). The repo was reformatted once, in its own commit. Markdown is excluded from Oxfmt, so hand-written docs keep their tables and emphasis markers.
- **Boundaries stay enforced by lint** (principle: never drop one silently):

  | Rule | Enforced by |
  |------|-------------|
  | `src/core` must not import `src/cli` | `no-restricted-imports` pattern `**/cli`, `**/cli/**` |
  | `src/core` must not import `@clack/prompts` or `react` | `no-restricted-imports` paths and patterns |
  | `src/core` must not use `console` | `no-console` and `no-restricted-globals` |
  | `src/core` must not use `process.stdout` / `process.stderr` | `no-restricted-globals` on `process`, plus `no-restricted-imports` on `process` / `node:process`. Oxlint has no `no-restricted-properties`, so the whole `process` global is banned in the core, which is stricter than before. The core has no reason to touch `process` (it reports through an event callback) |
  | `packages/react` must not import `svgworm` | `no-restricted-imports` in `packages/react/oxlint.config.ts` |

- **Not ported:**
  - `@typescript-eslint/naming-convention`: it needs typescript-eslint's parser, which Oxlint cannot run. The scaffold did not enable it either, so nothing is lost today, but the `camelCase` / `PascalCase` naming from the global style guide is now a review convention, not a lint rule.
  - Import-sorting rules: Oxfmt sorts imports.
  - `eslint-config-prettier`: the Oxlint configs enable no formatting rules.
  - `no-restricted-exports` with `restrictDefaultExports`: replaced by `import/no-default-export` from the shared base config.
- **Git hooks tool: husky 9.1.7.** A commit-msg hook is the only hook needed. Husky is what the tooling repo itself uses, needs no binary beyond the npm package, and keeps the hook as a plain file in `.husky/`. Lefthook was rejected because it adds a second ecosystem (a Go binary and its own config format) for one hook. `simple-git-hooks` was rejected because it stores the command in `package.json`, away from where the `commitlint` call can be read and reviewed. Husky runs through the `prepare` script, which pnpm runs on `pnpm install`. It is a dev dependency only.
- **Commit rules:** `@jmlweb/commitlint-config` as is. Since 4.1.0 its default `subject-case` follows `@commitlint/config-conventional`, so subjects can cite upper-case ids (`TSK-010`, `ADR-0008`). CI checks the PR commit range.
- **Node rules:** `settings.n.convertPath` maps `src/**/*.ts` to `dist/**/*.js`, so `eslint-plugin-n` matches the `bin` entry (this is the documented fix for `n/hashbang`). `n/no-missing-import` is off only for `scripts/**`, which import build output, as the package README suggests.
- `eslint-plugin-n` is a dev dependency because `@jmlweb/oxlint-config-node` requires it as a peer. `eslint` is no longer a direct dependency and has no config here. pnpm still installs it, because `@jmlweb/oxlint-config-react` has `@eslint-react/eslint-plugin` as a peer, which depends on it. Nothing runs ESLint.
- No runtime dependency is added. `@svgworm/react` keeps zero dependencies.

Versions (dev, pinned exactly; each satisfies its `@jmlweb` peer range): `oxlint` 1.87.0, `oxfmt` 0.72.0, `oxlint-tsgolint` 7.0.2004, `eslint-plugin-n` 18.4.1, `@jmlweb/oxlint-config-node` 0.1.2, `@jmlweb/oxlint-config-react` 0.1.1, `@jmlweb/oxfmt-config-base` 0.2.2, `@jmlweb/tsconfig-node` 2.0.0, `@jmlweb/tsconfig-base` 2.0.0, `@jmlweb/vitest-config` 3.0.1, `@jmlweb/commitlint-config` 4.1.0, `@commitlint/cli` and `@commitlint/config-conventional` 21.2.3, `husky` 9.1.7.

## Evidence

- Migration guide: <https://jmlweb.github.io/tooling/guides/migrate-to-oxc/>. It states that Oxfmt and Oxlint are the recommended tools for new projects, that the ESLint and Prettier packages are in maintenance mode, which rules are not ported, and that `options.typeAware` must be set in the root config of the project (Oxlint ignores it in extended configs and skips type-aware rules without a warning). The tooling README and agent context (<https://jmlweb.github.io/tooling/llms-full.txt>) match.
- Lint run on 2026-10-11 against planted files (since removed), with `typeAware: true`:

  ```text
  packages/svgworm/src/core/planted.ts:1:1: error eslint(no-restricted-imports): '../cli/main.ts' import is restricted from being used by a pattern. help: src/core must not import src/cli. ...
  packages/svgworm/src/core/planted.ts:2:1: error eslint(no-restricted-imports): '@clack/prompts' import is restricted from being used. ...
  packages/svgworm/src/core/planted.ts:3:1: error eslint(no-restricted-imports): 'react' import is restricted from being used. ...
  packages/svgworm/src/core/planted.ts:7:3: error eslint(no-restricted-globals): Unexpected use of 'process'. ...   (process.stdout.write)
  packages/svgworm/src/core/planted.ts:6:3: error eslint(no-console): Unexpected console statement.
  packages/react/src/planted.ts:1:1: error eslint(no-restricted-imports): 'svgworm' import is restricted from being used. ...
  packages/svgworm/src/core/planted.ts:8:3: error typescript(no-floating-promises): Promises must be awaited, add void operator to ignore. ...
  packages/react/src/planted.ts:3:14: error typescript(no-unsafe-assignment): Unsafe assignment of an error typed value. ...
  ```

  `no-floating-promises` and `no-unsafe-assignment` need type information, so this also shows that type-aware rules are active under TypeScript 6.0.3.
- A commit message with a non-conventional header (`Added stuff`) fails `commitlint`; `chore(scaffold): add tooling (TSK-010)` passes.
- From the final branch: `lint`, `format:check`, `typecheck`, `typecheck:ts7`, `build`, `test` and `check:packages` pass locally.

## Consequences

- One lint run takes milliseconds instead of seconds, and one set of shared configs covers lint, format, tsconfig, tests and commits.
- The shared Oxlint and Oxfmt packages are `0.x`. Pinning exact versions keeps the lint and format output stable, and updates are deliberate.
- The Oxlint boundary rules are configured per directory, so a new `src/` layout needs its rule updated. The nested `packages/react/oxlint.config.ts` replaces the root rules for that package, so a rule added at the root does not reach `packages/react` automatically.
- `naming-convention` is no longer machine-checked. If naming drifts, add a custom JS plugin rule rather than a new tool.
- Contributors need the editor extension for Oxc instead of ESLint and Prettier.
- Follow-up (not in this task): move the repo toolchain to TypeScript 7 at 7.1.
