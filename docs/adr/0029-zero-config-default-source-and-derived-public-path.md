# 0029. Zero-config default source and a `publicPath` derived from a `public/` outDir

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-088 (plan PLN-004)
- **Supersedes:** [ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md) ("never a guess" clause for `outDir` without `publicPath` only)

## Context

`sources` is the only required config key. Plain `svgworm` with no config file and no `--source` exits 2, and `svgworm init` hides this because it writes the config. Manual setups and the docs tripped over it (LRN-040, TSK-047).

[ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md) fixed two defaults, `outDir` = `public/icons` and `publicPath` = `/icons`, because Next.js, Vite and Astro all serve `public/` at the site root. It also made `outDir` without `publicPath` a config error: "never a guess". That clause rejects `outDir: "public/sprites"`, where the URL is not a guess but the same assumption the defaults already rely on.

Forces:

- **Deterministic output** (principle 2) and **fail loudly** (principle 5): no scanning of candidate folders, no silent choice between several.
- **Findable by humans and agents** (principle 10): fewer required keys means shorter copy-pasteable setups.
- The generated output and the manifest do not change. Only what the config accepts widens.

## Options considered

### Default source

1. **A fixed default folder `icons`, relative to the working directory.** Chosen. It matches what `svgworm init` already proposes (`DEFAULT_SOURCE`), and one fixed name never guesses between candidates.
2. **Scan for `src/icons`, `assets/icons`, `public/svg`…** Rejected: the result depends on which folders exist, and two candidates force a guess.
3. **Keep `sources` required.** Rejected: it keeps the first-run error LRN-040 found.

### `publicPath` when `outDir` is set

1. **Derive it when `outDir` is under `public/`.** Chosen. `public/<rest>` gives `/<rest>`, and `public` alone gives the site root. An `outDir` anywhere else keeps the error, now naming `public/` as the derivable case. An explicit `publicPath` always wins.
2. **Keep the error for every `outDir`.** Rejected: it punishes the case the defaults already assume.
3. **Derive it for any `outDir`** (`static/sprites` gives `/static/sprites`). Rejected: this is the wrong URL for Vite, Astro and Next `public/`-less setups, and it is a guess.

### String shorthand

`"sources": "icons"` is accepted next to the array form and normalizes to `["icons"]`. It adds no key and no format.

## Decision

- `sources` is optional and defaults to `icons`. It also accepts a single string.
- When `publicPath` is unset and `outDir` is a relative path under `public/`, `publicPath` is derived: `public/sprites` gives `/sprites`, `public` gives the site root. Derivation uses POSIX-normalized path segments, never a string prefix, so `publicity/x` does not match, and `./public/x/` and `public\x` give `/x`. An `outDir` with `..` segments or an absolute `outDir` is not derived.
- Any other `outDir` without `publicPath` is still a config error (exit 2), and the message names the `public/` rule.
- `loadConfig` no longer fails early when there is no config file and no `--source`. If the default `icons/` folder is missing, it fails with a message that keeps the "found one in <dir>" hint for a config file above.
- `ResolvedConfig` carries `isDefaultSources`. The CLI reports it so zero-config is never invisible: the plain reporter prints `svgworm: using default source icons/`, and the `--json` documents carry `"sourcesDefaulted": true` (always present, `false` otherwise). The core stays free of stdout.
- `svgworm init` keeps writing `sources` explicitly and imports the shared default.
- The reporter line says "using default source", not "no config file", because a config file without `sources` also triggers the default.
- No warning is added when a config file exists above while `./icons` exists. The notice line names the folder in use, which is the signal; a wrong-folder run in a monorepo is visible in the first output.
- `basePath` (Next.js) and `base` (Astro, Vite) are still **not** derived. They must be added to `publicPath` by hand, and the docs keep that warning.

## Evidence

- LRN-040 (TSK-047): the first-run failure of plain `svgworm`.
- ADR-0010: the defaults `public/icons` and `/icons`, and the `public/` assumption they rest on ("Next.js, Vite, and Astro … all serve `public/` at the root"), verified in the TSK-004 spike for Next.js, and by the working `examples/vite-react` and `apps/site` (Astro) setups.
- Tests in `src/core/config/resolve.test.ts` and `schema.test.ts` cover every derivation case above, and the CLI snapshots cover the notice.

## Consequences

- The config schema (public API, shipped JSON Schema) only widens, so this is a minor bump before 1.0. The output contract does not change.
- Manual setups can drop `--source icons` and `publicPath` for any `public/…` `outDir`. The docs, `llms.txt`, README and both skills are updated in the same change.
- A project whose icons live in another folder still needs `sources` or `--source`.
- Derivation does not know about a mount point. A user with `basePath` must still set `publicPath` by hand, as ADR-0010 documents.
