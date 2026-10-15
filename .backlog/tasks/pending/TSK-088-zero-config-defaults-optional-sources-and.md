---
id: TSK-088
title: Zero-config defaults: optional sources and publicPath derived from outDir
status: pending
priority: P2
tags: []
created: 2026-10-15
source: idea/PLN-004
depends-on: []
---

# Zero-config defaults: optional sources and publicPath derived from outDir

## Description

### Goal

Lower the entry barrier without adding keys, flags or config formats:

1. `sources` becomes optional and defaults to the fixed folder `icons`, so plain `svgworm` works with no `svgworm.config.json` when `./icons` exists.
2. `publicPath` is derived from `outDir` when `outDir` is under `public/` (`public/sprites` gives `/sprites`). Any other `outDir` without `publicPath` keeps today's error.
3. `sources` also accepts a single string (`"sources": "icons"`).
4. When the source folder comes from the default, the plain and `--json` reporters say so, so zero-config is never invisible.

### Context

- LRN-040: `sources` is the only required key, and plain `svgworm` with no config file and no `--source` exits 2. `init` hides this because it writes the config. Manual setups and docs tripped over it (TSK-047).
- ADR-0010 sets `outDir` = `public/icons` and `publicPath` = `/icons` as defaults, because Next.js, Vite and Astro all serve `public/` at the root. It also says "if `outDir` is set and `publicPath` is not, it is a config error (exit 2), never a guess". Deriving `publicPath` from a `public/…` `outDir` reuses the same assumption the defaults already rely on, but it reverses that clause, so it needs a new ADR (principle 5, decisions.md).
- `init` already defaults its source to `icons` (`DEFAULT_SOURCE` in `src/cli/init/plan.ts`), so the zero-config default matches what `init` writes.
- A fixed default (no scanning for `src/icons`, `assets/icons`…) keeps the result deterministic and never guesses between candidates (principles 2 and 5).
- The output contract (generated files, manifest) does not change. The config schema is public API (JSON Schema shipped in the package), and these changes only widen what it accepts: a minor bump before 1.0.
- No active task conflicts (TSK-019 and TSK-030 are outreach). No pending reports.

### Approach

1. **ADR-0029** (`docs/adr/0029-zero-config-default-source-and-derived-public-path.md`): default `sources` = `icons`, string shorthand, and `publicPath` derived from a `public/<rest>` `outDir` (`public` alone gives `/`). It supersedes only ADR-0010's "never a guess" clause, and cites LRN-040, the Next.js, Vite and Astro `public/` behaviour, and the ADR-0017 `base` finding. ADR-0010 stays immutable. Add a "superseded in part by 0029" status note only if the template allows it.
2. **Tests first** in `src/core/config/resolve.test.ts` and `schema.test.ts`:
   - `resolveConfig({}, cwd)` gives `sources: [{ dir: 'icons' }]` and marks the default.
   - `sources: 'icons'` normalizes the same as `['icons']`.
   - `outDir: 'public/sprites'` gives `publicPath: '/sprites'`. `outDir: 'public'` gives `''`. `outDir: './public/x/'` and Windows `public\\x` normalize to `/x`.
   - `outDir: 'static/sprites'` without `publicPath` still errors, and the message names `public/` as the derivable case.
   - An explicit `publicPath` always wins over derivation.
   - `loadConfig` with no file and no `--source`, when `./icons` exists, builds from `icons`.
   - With no file and no `./icons`, it errors: no config file and no default `icons/` folder, run `svgworm init` or pass `--source <dir>`. The "found one in <dir> above" hint is kept.
3. **Schema** (`src/core/config/schema.ts`): `sources` becomes `z.union([z.string().min(1), z.array(...).min(1)]).optional()`, and the descriptions mention the defaults. Derivation stays out of the schema and lives in `resolveConfig`.
4. **Resolver** (`src/core/config/resolve.ts`):
   - Add `DEFAULT_SOURCE = 'icons'`.
   - Normalize a string `sources` to an array.
   - Derive `publicPath` from a `public/` `outDir` using POSIX-normalized, segment-based path logic, never a string prefix, so `publicity/x` does not match.
   - Add `isDefaultSources: boolean` (or `sourcesOrigin`) to `ResolvedConfig`.
   - `loadConfig` stops throwing early when there is no file and no override. When the default folder is missing, it throws the reworded `describeMissingConfig`. Check for the folder in `loadConfig` (the I/O layer), not in the pure `resolveConfig`.
   - Make `init` import the shared default instead of its own constant.
5. **Reporting**: the CLI reads `isDefaultSources` from the resolved config, or the core emits it on an existing start event (check `src/core/events.ts` and `api.ts`, and pick whichever keeps the core free of stdout). Plain prints one line: `svgworm: no config file, using default source icons/`. JSON adds a stable field, for example `"sourcesDefaulted": true`. Snapshot both reporters, not clack (testing.md).
6. **Schema artifact**: `pnpm build && pnpm schema:generate`, then commit `packages/svgworm/svgworm.schema.json`.
7. **Docs** in the same change:
   - Site `config.md`: the `sources` default becomes `icons`, and the `outDir` row reads "`publicPath` derived when under `public/`, otherwise required".
   - Site `cli.md`, `nextjs.md`, `vite.md`: manual setup can drop `--source icons`.
   - `llms.txt`, the README get-started, `skills/svgworm-nextjs/SKILL.md`, `skills/svgworm-astro/SKILL.md`, and `src/cli/help.ts`.
   - Keep the warning that `basePath` and Astro `base` must be added to `publicPath` by hand.
   - Update LRN-040's Application, or add a learning that supersedes it.
8. **Changeset**: minor for `svgworm`.
9. Run `pnpm verify`, `pnpm typecheck:ts7`, and the example, site and determinism checks. Results must be unchanged, because the examples set `sources` explicitly.

### Review notes (approval)

- A config file without `sources` also triggers the default, so the reporter line must not claim "no config file" then; word it as "using default source icons/".
- Decide in ADR-0029 whether to warn when a config exists above while `./icons` exists (guards the wrong-folder case).
- ADR-0010 status: use the template's `superseded by 0029` wording or leave it untouched.
- Open questions resolved: default-source fact is a field on `ResolvedConfig` reported by the CLI; `init` keeps writing `sources` explicitly.

## Acceptance Criteria

- [ ] ADR-0029 written and accepted: default sources icons, string shorthand, publicPath derived from public/ outDir, supersedes ADR-0010 never-a-guess clause
- [ ] Tests written first in resolve.test.ts and schema.test.ts cover default source, string shorthand, publicPath derivation (incl. ./public/x, trailing slash, Windows backslash, public alone, publicity/x non-match), explicit publicPath wins, non-public outDir still errors
- [ ] sources optional and accepts a string in schema.ts; derivation lives in resolveConfig
- [ ] loadConfig builds from ./icons with no config and no --source; errors with reworded message (keeping found-above hint) when ./icons is missing
- [ ] ResolvedConfig exposes the default-source fact; plain reporter prints a notice and JSON adds a stable field; non-TTY snapshots updated
- [ ] init reuses the shared DEFAULT_SOURCE
- [ ] watch uses the default source (tested)
- [ ] svgworm.schema.json regenerated
- [ ] Docs updated: site config/cli/nextjs/vite, llms.txt, READMEs, both skills, help.ts, LRN-040; basePath/base warning kept
- [ ] Minor changeset for svgworm
- [ ] pnpm verify, typecheck:ts7, example, vite, site and determinism checks pass with unchanged output

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created