# 0025. No alias map for icon names

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-025
- **Resolves:** Q-32 (the alias-map part left open by ADR-0007)

## Context

[ADR-0007](0007-icon-naming-and-collision-policy.md) makes a collision an error and left an alias map for later: a config entry that gives an icon a public name other than the one its path produces, to settle a collision or to rename an icon without touching the file. Since then two decisions added cases an alias map could serve. [ADR-0021](0021-no-camel-case-splitting-warn-when-case-carried-meaning.md) keeps `ArrowLeft.svg` as `arrowleft` and names an alias map as a way to get `arrow-left` without a rename. [ADR-0020](0020-select-icons-from-a-source-with-include-and-exclude-globs.md) made icon packages a source, and files inside `node_modules` cannot be renamed.

## Options considered

1. **Alias map** in the config (`"names": { "ArrowLeft.svg": "arrow-left" }`, keyed by source path, or by derived name).
   - Pros: renames without touching files; settles a collision between two files the user cannot rename.
   - Cons: the name stops being a function of the path alone; the config becomes a second source of truth that drifts when files move (a stale key must be an error, or it silently stops applying). Keys by derived name are ambiguous exactly when they are needed (a collision has one name for two files); keys by path depend on the source folder layout. Every reporter, the `check` icon diff and the docs would carry the indirection.
2. **Rename the file** (today), with `exclude` for package files ([ADR-0020](0020-select-icons-from-a-source-with-include-and-exclude-globs.md)) and the `name/case-folded` warning to point at the readable name ([ADR-0021](0021-no-camel-case-splitting-warn-when-case-carried-meaning.md)).

## Decision

Option 2. No alias map. The public name stays a pure function of the path inside the source folder, and the fix for a collision or an unwanted name is to rename your file or exclude the package file.

The case an alias map would uniquely solve is the same name in two packages you cannot rename (Lucide's `x` and Tabler's `x`, both wanted). That is the per-source prefix ADR-0020 left open (its option 4), not an alias map. It stays open until someone reports it.

## Evidence

- No common icon package needs a rename for readability. File names counted on 2026-10-15 from the npm tarballs (`npm pack`): `lucide-static@0.545.0` 1,866 SVGs, `@tabler/icons@3.35.0` 10,419, `heroicons@2.2.0` 1,288, `@mdi/svg@7.4.47` 7,447, `simple-icons@15.17.0` 3,365, `@phosphor-icons/core@2.1.1` 9,072. Of those 33,457 file names, 0 match `[a-z][A-Z]`, so ADR-0021's warning never fires on a package source. camelCase names come from the user's own exports, which can be renamed.
- Collisions between the user's icons and a package's are settled by `exclude`, covered by the ADR-0020 tests in `config/schema.test.ts` and `discover.test.ts`.
- [ADR-0007](0007-icon-naming-and-collision-policy.md) and its spike: names derived from the path alone are what make the output deterministic across machines.

## Consequences

- No change to the output contract or config. `docs/output-contract.md` says there is no alias map, with a link here; Q-32 links here.
- A per-source prefix (ADR-0020 option 4) is the next step if two packages collide in practice.
