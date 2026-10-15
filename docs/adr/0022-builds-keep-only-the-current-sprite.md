# 0022. Builds keep only the current sprite; deploy skew is handled at deploy time

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-065
- **Resolves:** none (R-15 follow-up)

## Context

Each build writes a sprite and stack named by their content hash and removes the hashed files of the previous build (R-15, [ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md)). Dogfooding 0.2.1 raised deploy skew: HTML from the previous deploy, still held by a CDN or a browser, points at `icons.<old-hash>.svg`, which the new deploy no longer serves. The question is whether `svgworm build` should keep the previous sprite around for one release.

The window is narrow. A page that has already loaded the sprite keeps it in memory and in the immutable HTTP cache, and one sprite holds every icon, so client-side navigation inside an open tab is not affected. Next.js client navigation fetches new RSC payloads from the new deploy, which name the new hash. The 404 needs HTML that outlives the deploy *and* a sprite that was never fetched or was evicted: mostly HTML cached at the edge with a long `s-maxage`, or a CDN bucket synced with deletion.

## Options considered

1. **Keep the previous generation in `outDir`.** The build reads the committed `manifest.json`, keeps the files it names, and prunes anything older.
   - Pros: no 404 for one release on hosts that serve `outDir` as is.
   - Cons: the output becomes a function of what is on disk, not of the inputs. Two clean checkouts at the same commit can hold different `outDir` contents (one built once, one built twice), which breaks principle 2. `svgworm check` would have to accept one extra hashed file, so it could no longer report a stale sprite that is truly stale, and a committed `public/icons` would carry two sprites in every commit. It also does nothing on hosts that serve only the current deploy's files (atomic deploys): there the old sprite goes away with the old deploy, whatever `outDir` holds.
2. **Keep N generations behind a config key.** Same problems, plus a knob nobody can set correctly without knowing their host's cache policy. Rejected with option 1.
3. **Keep the build as it is and document how to deploy without skew.** The fix lives where the skew lives: in the deploy step (sync without deletion, deploy the sprite before the HTML, short HTML caches).

## Decision

Option 3. `svgworm build` keeps writing exactly the current sprite and stack and removing the previous hashed files, as R-15 and ADR-0010 define. The docs describe deploy skew and its fixes in the troubleshooting "sprite 404s" entry:

- Upload `outDir` to a bucket or CDN without deleting old files (`aws s3 sync` without `--delete`, `rclone copy` rather than `sync`), and expire old hashed files by age if needed. Hashed names never collide.
- Deploy the sprite before the HTML that names it.
- Keep HTML caches short, or purge them on deploy. The sprite itself stays `immutable` for a year.

## Evidence

- `build.test.ts` "removes only stale hashed sprite files (R-15)" and "is idempotent, and a rebuild with the same input rewrites nothing": today two builds of one input give one byte-identical `outDir`, which option 1 would break (the second build would keep a file the first one did not).
- `check.test.ts` "reports a changed module, a missing sprite and a stale sprite after icons change": `check` relies on "a hashed file not in the manifest is stale". Option 1 would have to exempt the previous generation, so a forgotten rebuild after two icon changes would pass `check`.
- `packages/svgworm/src/core/write.ts`: pruning reads only the current compile's file list and the owned-file pattern, never earlier output, which is what keeps `build` a pure function of the sources plus the config.

## Consequences

- No change to the output contract, the CLI or the config.
- Users who sync `outDir` to a CDN own the retention of old sprites. The cross-origin work (TSK-067) inherits this note.
- Revisit only with a report of skew on a host where keeping old files in `outDir` would actually help.
