# AGENTS.md

Source of truth for any AI agent or human working on svgworm. Read this first.

## What svgworm is

A CLI that turns a folder of SVG files into **type-safe, cacheable SVG sprites** plus thin framework adapters. React comes first, and its component must work in Server Components with zero client JS. Published as an open-source npm package.

Full context: [docs/vision.md](docs/vision.md) and [docs/viability.md](docs/viability.md).

## Current phase: v0.1 released, adoption window

`svgworm@0.1.0` and `@svgworm/react@0.1.0` have been on npm since 2026-10-13 ([docs/release.md](docs/release.md)). Until the kill-criteria review on 2027-01-05 ([ADR-0005](docs/adr/0005-build-standalone-with-kill-criteria.md), `node scripts/traction-snapshot.mjs --review`) the work is adoption ([docs/traction.md](docs/traction.md), `docs/outreach/`) plus fixes; every user-facing change needs a changeset, and the output contract may still change in a minor before 1.0 with an ADR.

- **The stack is decided** in [ADR-0008](docs/adr/0008-tech-stack-and-package-layout.md): Node `^22.20 || >=24.11`, TypeScript 6 strict ESM, `tsc`, Vitest, svgo 4, `node:util.parseArgs`, @clack/prompts, and a JSON config validated with zod. It is a pnpm workspace with `svgworm` (core + CLI) and `@svgworm/react` in `packages/` (published), the Next.js example in `examples/` (documented usage), and the landing page in `apps/site` (deployed; Astro on Cloudflare Workers static assets, [ADR-0016](docs/adr/0016-project-site-astro-on-cloudflare-workers.md)). Lint and format are Oxlint and Oxfmt on the shared `@jmlweb/*` configs, which supersede ADR-0008's ESLint + Prettier row ([ADR-0011](docs/adr/0011-oxc-lint-format-and-shared-tooling-configs.md)). Release and license are in [ADR-0009](docs/adr/0009-license-versioning-and-release.md).
- **The walking skeleton is in place (TSK-011).** `svgworm` compiles a folder of SVGs into a hashed sprite, a stack file, a manifest module, and types, through `src/core` (pure `compile`, plus `build` for the file system) and a thin CLI in `src/cli` (`build`, `check`, `watch`, `init`; plain, `--json`, and clack reporters; exit codes 0, 1, 2). `@svgworm/react` exports `createIcon(manifest)` (TSK-012), and `examples/next-app-router` is the documented Next.js 16 path with a zero-client-JS check (TSK-016). Spikes may still produce throwaway prototypes under `spikes/<task-id>-<slug>/`. A prototype is evidence, not product code.
- **No new tool, library, or runtime choices without an ADR** in `docs/adr/` (see `.claude/rules/decisions.md`). Runtime dependencies are capped by ADR-0008's budget.
- The old prototype on the `prototype` branch (formerly `main`) is reference material only. Port *ideas*, not code. `main` is the default and release branch.

## Product principles (non-negotiable unless an ADR changes them)

1. **Zero-JS by default.** The default delivery is an external sprite file referenced via `<use href>`. An inline sprite is opt-in. This binds what svgworm *generates* (sprites, manifest, types, adapter components): they must never need client JS to render an icon. It does not bind the project's own surfaces: the website (`apps/site`), the examples and tooling may use client-side JS freely.
2. **Deterministic output.** The same input gives byte-identical output on every OS and every run. No dependence on crawl order, timestamps, or locale.
3. **Agnostic core, thin adapters.** The core knows nothing about React or any other framework. Adapters only consume the output contract.
4. **Types are the product.** Icon names must be checked at compile time, and an invalid name must be a type error.
5. **Fail loudly and early.** Name collisions, invalid SVGs, and unsupported features produce clear errors, never silent renames.
6. **Per-icon correctness.** Color handling (mono, stroke, multicolor) is decided per icon, not globally.
7. **CLI UX is a feature, not polish.** Animations, progress, interactive prompts, and end-of-run stats (icons, sprites, sizes, savings, timing) are required. The UX lives in the CLI shell, never in the core, and degrades to plain, stable output when not a TTY (CI, pipes, `--json`).
8. **Modern baseline only.** Target current, maintained versions of runtimes, browsers, and tools. No polyfills or workarounds for legacy versions. The exact range is set in the stack ADR.
9. **Test-first by habit.** Write or sketch the test before the code: a failing test, a snapshot, or a type test. Not dogmatic: spikes and exploratory prototypes may skip it, but product code lands with tests. See `.claude/rules/testing.md`.
10. **Findable by humans and AI agents.** README, package metadata, docs, and CLI help are written to be discovered and understood by search engines and AI agents: clear keywords, `llms.txt`, copy-pasteable examples, a JSON Schema for the config, and full non-interactive use (flags, `--json`, stable exit codes).

Any decision here, in an ADR, or in the docs may be questioned. If you think one is wrong, say so explicitly and propose a change (a superseding ADR for accepted ones). Never silently work around it.

## Commands

Requires Node `^22.20 || >=24.11` and pnpm (pinned by `packageManager`; use Corepack or the pnpm action).

| Command | What it does |
|---------|--------------|
| `pnpm install` | Install the workspace |
| `pnpm build` | `tsc` build of both packages into `dist/` |
| `pnpm test` | Vitest: unit and snapshot tests (`*.test.ts`) and type tests (`*.test-d.ts`) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm typecheck` | `tsc --noEmit` per package (TypeScript 6) |
| `pnpm typecheck:ts7` | Same, with TypeScript 7 via `pnpm dlx` |
| `pnpm lint` / `pnpm lint:fix` | Oxlint (type-aware), including the `src/core` and `@svgworm/react` boundary rules |
| `pnpm format` / `pnpm format:check` | Oxfmt write / check (Markdown is excluded) |
| `pnpm commitlint` | Check a commit message (stdin or `--from`/`--to`); a husky `commit-msg` hook runs it on every commit |
| `pnpm check:packages` | publint and Are the Types Wrong on each package (run `pnpm build` first) |
| `pnpm determinism:fingerprint` | Fingerprint `fixtures/**/*.svg` with the built core (run `pnpm build` first). CI requires identical output on Linux, macOS, and Windows |
| `pnpm example:build` / `pnpm example:check` | Build the Next.js 16 example in `examples/next-app-router` with Turbopack, or check it: committed svgworm output current, then build, then no icon code in client chunks (run `pnpm build` first) |
| `pnpm site:build` / `pnpm site:check` | Build the landing page in `apps/site` with Astro, or check it: committed svgworm output current, then build, then every icon from the hashed sprite (run `pnpm build` first) |
| `pnpm verify` | Everything above that CI runs on one OS, except the Next.js example |
| `pnpm changeset` | Record a changeset for a user-facing change |

CI (`.github/workflows/ci.yml`) runs on every PR: quality checks, tests on Linux, macOS, and Windows with Node 22, 24, and 26, a TypeScript 7 typecheck, the cross-OS determinism comparison, the Next.js example (Turbopack build and zero-client-JS check), the site check, commit messages checked with commitlint over the PR range, and a changeset reminder. `.github/workflows/site.yml` deploys `apps/site`: production from `main`, a preview per same-repo PR.

### Shared tooling (jmlweb/tooling)

Lint, format, tsconfig, Vitest defaults and commit rules come from the `@jmlweb/*` packages of [jmlweb/tooling](https://github.com/jmlweb/tooling) ([docs](https://jmlweb.github.io/tooling/), [agent context](https://jmlweb.github.io/tooling/llms-full.txt)), chosen in [ADR-0011](docs/adr/0011-oxc-lint-format-and-shared-tooling-configs.md).

- Versions are pinned exactly. When new versions are published, bump them together, then run `pnpm install`, `pnpm verify` and `pnpm typecheck:ts7`.
- The tooling repo belongs to the project owner. If a shared config needs a local workaround, report it upstream and remove the workaround after the fix is published, instead of keeping it.
- `pnpm install` sets up the husky hook in each checkout. A new worktree needs its own `pnpm install` before the hook runs.

## Workflow (flowstate)

Backlog lives in `.backlog/`. Always use the flowstate skills; never edit index files by hand.

| When | Skill |
|------|-------|
| Session start / choosing work | `/flowstate:next-task`, `/flowstate:overview` |
| Before starting | `/flowstate:learnings` (search relevant tags) |
| Begin work | `/flowstate:start-task <id>` |
| Need a design before coding | `/flowstate:idea`, then `/flowstate:review-idea` |
| Blocked | `/flowstate:block-task` |
| Found a bug or a surprise | `/flowstate:report` |
| Non-obvious insight | `/flowstate:add-learning` |
| Finished | `/flowstate:complete-task` |
| New work discovered | `/flowstate:add-task` (don't silently expand scope) |

## Definition of Done

- All acceptance criteria of the task are met and stated in the task's progress log.
- Spikes end with an ADR (accepted or rejected) and a learning, plus updates to `docs/open-questions.md`.
- Any doc made stale by the change is updated in the same change.
- Once code exists: tests were written first or alongside the code, they pass, and output snapshots are reviewed.
- Commits follow Conventional Commits. Never push without explicit permission.

## Docs map

- `docs/vision.md`: why and for whom
- `docs/viability.md`: feasibility, risks, prototype lessons, competitors
- `docs/requirements.md`: what (user stories)
- `docs/cli.md`, `docs/config.md`, `docs/nextjs.md`, `docs/astro.md`: CLI reference, config keys, manual Next.js setup, Astro setup with the generated `Icon.astro` (the README links to them)
- `docs/output-contract.md`: the core/adapter boundary (generated files)
- `docs/comparison.md`: honest comparison with SVGR, @neodx/svg and others (spike numbers)
- `docs/traction.md`: how we get users and AI agents to adopt it (human and agent tracks, metrics)
- `docs/release.md`: release checklist and the one-time npm trusted-publishing setup
- `docs/metrics/`: weekly traction snapshots (`traction.jsonl`), `manual.json` for human-known facts, kill-criteria review via `scripts/traction-snapshot.mjs --review`
- `docs/outreach/`: target repo list, upstream issue drafts, launch plan; `docs/posts/`: blog post drafts
- `skills/svgworm-nextjs/SKILL.md`, `skills/svgworm-astro/SKILL.md`: the agent skills that set svgworm up in a Next.js or an Astro app
- `llms.txt`: summary for AI agents (keep in sync with the README get started, `docs/cli.md` and `docs/config.md`)
- `docs/open-questions.md`: unknowns; each one should map to a task
- `docs/adr/`: decisions, numbered and immutable once accepted (supersede, don't edit)
- `.claude/rules/`: focused rules for architecture, decisions, and testing
