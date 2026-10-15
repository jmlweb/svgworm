# 0020. Select icons from a source folder with `include` and `exclude` globs

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-059
- **Resolves:** Q-52

## Context

The most common icon source is not a hand-drawn folder but a package: `lucide-static`, `@tabler/icons`, `simple-icons`. Until now `sources` took folders only, so a user who wanted twelve Lucide icons had to copy files out of `node_modules` (and lose updates), or point a source at the whole package. The whole package builds clean (TSK-059 dogfooding: 8 popular sets, about 18k files, about 1 s), but it makes a sprite nobody should ship: every page downloads every icon ([ADR-0019](0019-sprite-preload-not-recommended.md) and the performance notes already warn about large sets), and `svgworm/icons.d.ts` lists thousands of names.

The config is a public contract ([ADR-0008](0008-tech-stack-and-package-layout.md): JSON validated with zod, published as a JSON Schema), so adding a way to pick a subset is a decision, not a patch. Names are also a contract ([ADR-0007](0007-icon-naming-and-collision-policy.md)): a pure function of the path inside the source folder.

## Options considered

1. **`include` / `exclude` globs per source, on the path inside the folder.** A source entry becomes a string (as before) or `{ "dir", "include", "exclude" }`. Matching uses `node:path.matchesGlob` (`*`, `**`, `?`, `[…]`, `{a,b}`), which the Node range already has. Names stay what ADR-0007 says: the path inside `dir`, so `house.svg` is `house`.
   - Pros: additive and backward compatible; one concept (a source folder) gains two fields; no new dependency; the same mechanism covers "all but the drafts" in a user's own folder; the overlap check and the watcher work on `dir` unchanged.
   - Cons: the package folder is not part of the name, so an own `house.svg` next to Lucide's collides. That is the existing collision rule and the message says how to fix it.
2. **An `icons` list of names per source** (`"icons": ["house", "menu"]`).
   - Pros: reads like the component usage.
   - Cons: a second naming surface (file name vs public name) to keep in sync; no way to say "all arrows"; a typo is silent until the name is missing. Rejected.
3. **A package-aware source** (`"package": "lucide-static"`) that knows where each set keeps its SVGs.
   - Cons: a registry of package layouts to maintain, and the layouts differ (`icons/`, `icons/outline/`, `assets/`). A folder path says the same thing without a registry. Rejected; option 1 covers it.
4. **A name prefix per source** (`"prefix": "lucide"` so Lucide's `house` becomes `lucide/house`).
   - Not needed to answer the question; it changes the naming contract and deserves its own decision if collisions between a package and own icons turn out to be common. Deferred.

## Decision

- `sources` entries are a folder path or `{ "dir": string, "include"?: string[], "exclude"?: string[] }`. `include` keeps only files that match one of its globs, `exclude` drops matches after that; without `include` every `.svg` file counts. Globs match the `/`-separated path inside `dir`.
- Names are unchanged: the path inside `dir`, by the ADR-0007 rules. The package folder never enters the name.
- The source folder itself may be a symlink (a package in a pnpm `node_modules`); symlinks inside a folder are still skipped.
- `--source` on the CLI takes paths only. Globs need the config file.
- The JSON Schema, the docs ([config](https://svgworm.com/docs/config/#icons-from-a-package)), `llms.txt` and both agent skills describe the shape. The change ships as a minor with a changeset.

## Evidence

The built CLI on a scratch project with `lucide-static@1.57.0` (2,154 icons) and `@tabler/icons@3.49.0` (5,184 outline icons), 2026-10-15:

| Config                                                   | Icons | Sprite      | Time   |
| -------------------------------------------------------- | ----- | ----------- | ------ |
| Lucide, `include` of 12 named files                      | 12    | 3.1 KiB     | 14 ms  |
| Lucide, `include: ["arrow-*.svg"]`, `exclude: ["arrow-big-*.svg"]` | 62 | 13.8 KiB | 28 ms  |
| Lucide, the whole folder                                 | 2,154 | 643.8 KiB   | 425 ms |
| Tabler outline, `include` of 10 files with `{a,b}`       | 10    | 2.9 KiB     | 13 ms  |
| Tabler outline, the whole folder                         | 5,184 | 1,792.5 KiB | 1.06 s |

An own `icons/house.svg` next to Lucide's `house.svg` fails with `name/collision … Fix: rename one of the files or folders`, as the naming rules require. Unit tests cover include, exclude, `**`, the string and object forms being equal, and a symlinked source folder; a CLI test builds a subset from a `node_modules` folder.

## Consequences

- Users pick icons from a package without copying files, and the sprite stays the size of what they render.
- `ResolvedConfig.sources` is a list of `{ dir, include?, exclude? }` objects (a string entry normalizes to `{ dir }`); the watcher and the reporters read `dir`.
- Open follow-ups: a per-source name prefix (option 4) if package-vs-own collisions are reported; keeping the package's `@license` comments in the sprite (TSK-066), which matters more now that packages are a first-class source.
