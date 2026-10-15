---
id: PLN-004
title: Zero-config defaults: optional sources and publicPath derived from outDir
status: approved
created: 2026-10-15
complexity: medium
reviewed: 2026-10-15
task-id: TSK-088
---


## Goal

Lower the entry barrier without adding keys, flags or config formats:

1. `sources` becomes optional and defaults to the fixed folder `icons`, so plain `svgworm` works with no `svgworm.config.json` when `./icons` exists.
2. `publicPath` is derived from `outDir` when `outDir` is under `public/` (`public/sprites` gives `/sprites`). Any other `outDir` without `publicPath` keeps today's error.
3. `sources` also accepts a single string (`"sources": "icons"`).
4. When the source folder comes from the default, the plain and `--json` reporters say so, so zero-config is never invisible.

## Context

- LRN-040: `sources` is the only required key, and plain `svgworm` with no config file and no `--source` exits 2. `init` hides this because it writes the config. Manual setups and docs tripped over it (TSK-047).
- ADR-0010 sets `outDir` = `public/icons` and `publicPath` = `/icons` as defaults, because Next.js, Vite and Astro all serve `public/` at the root. It also says "if `outDir` is set and `publicPath` is not, it is a config error (exit 2), never a guess". Deriving `publicPath` from a `public/…` `outDir` reuses the same assumption the defaults already rely on, but it reverses that clause, so it needs a new ADR (principle 5, decisions.md).
- `init` already defaults its source to `icons` (`DEFAULT_SOURCE` in `src/cli/init/plan.ts`), so the zero-config default matches what `init` writes.
- A fixed default (no scanning for `src/icons`, `assets/icons`…) keeps the result deterministic and never guesses between candidates (principles 2 and 5).
- The output contract (generated files, manifest) does not change. The config schema is public API (JSON Schema shipped in the package), and these changes only widen what it accepts: a minor bump before 1.0.
- No active task conflicts (TSK-019 and TSK-030 are outreach). No pending reports.

## Approach

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

## Files to Modify

- `docs/adr/0029-zero-config-default-source-and-derived-public-path.md`: new ADR.
- `packages/svgworm/src/core/config/schema.ts`: `sources` optional, accepts a string, descriptions updated.
- `packages/svgworm/src/core/config/resolve.ts`: default source, string normalization, `publicPath` derivation, `isDefaultSources`, missing-default error.
- `packages/svgworm/src/core/config/resolve.test.ts`, `packages/svgworm/src/core/config/schema.test.ts`: new cases first.
- `packages/svgworm/src/core/api.ts` / `packages/svgworm/src/core/events.ts`: expose the default-source fact, if it goes through events.
- `packages/svgworm/src/cli/reporters/plain.ts`, `packages/svgworm/src/cli/reporters/json.ts`, `packages/svgworm/src/cli/reporters/clack.ts`, `packages/svgworm/src/cli/reporters/types.ts`, `packages/svgworm/src/cli/reporters/reporters.test.ts`: the "using default source" line and JSON field.
- `packages/svgworm/src/cli/commands/build.ts`, `packages/svgworm/src/cli/commands/check.ts`, `packages/svgworm/src/cli/commands/watch.ts`: pass the fact to the reporter.
- `packages/svgworm/src/cli/run.test.ts` and `packages/svgworm/src/cli/__snapshots__/`: the no-config run, with and without `./icons`. The current no-config JSON snapshot changes (see commit 843c90e for the Windows path escaping).
- `packages/svgworm/src/cli/init/plan.ts`: reuse the shared `DEFAULT_SOURCE`.
- `packages/svgworm/src/cli/help.ts`: mention the defaults.
- `packages/svgworm/svgworm.schema.json`: regenerated.
- `apps/site/src/content/docs/config.md`, `cli.md`, `nextjs.md`, `vite.md`: defaults and manual setup.
- `llms.txt`, `README.md`, `packages/svgworm/README.md`: get-started commands.
- `skills/svgworm-nextjs/SKILL.md`, `skills/svgworm-astro/SKILL.md`: manual steps.
- `docs/output-contract.md`: only if it states that `sources` is required (expected unchanged).
- `.changeset/<name>.md`: minor for `svgworm`.

## Risks & Considerations

- **Silent wrong URL under `basePath` or `base`.** A derived `/sprites` 404s when the app runs under `/docs`. The `/icons` default already carries this risk, so derivation adds no new failure class. The docs and the ADR must state it, and `init` keeps proposing the value.
- **Fail loudly (principle 5).** A typo in a config without `sources` would now read `./icons` silently. The reporter line in step 5 is the mitigation. Only the key's absence triggers the default: an empty array or empty string stays a validation error.
- **Running in the wrong folder.** Running `svgworm` in a subfolder that happens to have `icons/` now builds there instead of erroring. Keep the "found a config above" hint when the default folder is missing. Consider also warning when a config file exists above even though `./icons` exists (cheap: `findConfigAbove` exists already).
- **Watch mode.** With the default source, `watch` must watch `icons/`. It already receives resolved sources, so verify with a test.
- **Snapshots.** The no-config error snapshots change, including the Windows-escaped path one.
- **Schema consumers.** Editors and agents validating against the old schema still accept the new configs, because every old config remains valid.
- **Path normalization.** Derivation must handle `./public/x`, trailing slashes and `\` on Windows (architecture.md), or Windows gets a different `publicPath`, which breaks determinism.

## Open Questions

- Should the "using default source" notice live in the reporter only (CLI concern), or be a core event so programmatic callers see it too? Lean: put a field on `ResolvedConfig`, and let the CLI report it.
- Should `init` stop writing `"sources": ["icons"]` now that it is the default? Lean: keep writing it, so the config is explicit and self-documenting.
