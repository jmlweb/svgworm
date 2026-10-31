---
id: PLN-008
title: Built-in sprite groups: several sprites from one config
status: pending
created: 2026-10-15
complexity: high
---

## Goal

Let one `svgworm.config.json` build several sprites (for example `app` and `marketing`), with one `IconName` type and one `Icon` component across all of them. This replaces the one-config-per-sprite recipe from ADR-0023.

## Context

- ADR-0023 chose one config per sprite and kept built-in groups (its option 2) for later. Reopen it when a user reports one of these: needing one component across sprites, an icon shared by groups, or per-route sprites that the recipe cannot express. **No user has reported one as of 2026-10-16. Do not start before that trigger.**
- Competitor pull: @neodx/svg makes one sprite per folder by default (`group: true`) or groups with a custom function. Its users would expect this when they migrate. It has about 2k weekly downloads.
- The contract was built to grow: the manifest has `sprites.<group>`, and `icons.<name>.sprite` names the group of each icon (ADR-0010, ADR-0012: multi-sprite "will add a group key, not change the existing ones"). Adapters need no change.
- `packages/svgworm/src/core/write.ts` `OWNED_FILE` (`^icons(?:\.stack)?\.<hash>\.svg$|^icons\.loader\.<hash>\.js$`) hard-codes the `icons` group. That fixed prefix is what makes pruning safe today.

## Approach

1. Write an ADR that supersedes ADR-0023's decision, citing the reported case.
2. Config: an optional `sprites` map in `src/core/config/schema.ts`, `{ "<group>": { "sources": [...] } }`. Groups share `outDir`, `publicPath` and `moduleDir`. A plain `sources` keeps meaning one `icons` group. Validate group names as `[a-z0-9-]+`, and reject `icons` used alongside a top-level `sources`.
3. Compile: run discovery, naming and collisions across all groups. Names stay global, so one `IconName` works. An icon in two groups is an error by default (principle 5). Whether to allow it explicitly goes in the ADR.
4. Assemble and emit: one sprite and one stack per group, `<group>.<hash>.svg` and `<group>.stack.<hash>.svg` (ADR-0010 naming). Build `OWNED_FILE` from the configured group names. Record the previous groups in the manifest, so a renamed group's files are pruned rather than orphaned.
5. Reporters: stats per group in plain, `--json` and clack output, and in `check`. Snapshot the plain and `--json` output.
6. Determinism: sort groups with the code-unit comparator, and add a shuffled-order test across groups.
7. Docs: `docs/output-contract.md`, the config docs ("Several sprites" section), `llms.txt`, both skills, and `svgworm.schema.json` regenerated.

## Files to Modify

- `docs/adr/NNNN-built-in-sprite-groups.md`: new, supersedes ADR-0023's decision
- `packages/svgworm/src/core/config/schema.ts`: the `sprites` map
- `packages/svgworm/src/core/config/resolve.ts`: resolve groups, defaults
- `packages/svgworm/src/core/compile.ts`: compile per group, global names
- `packages/svgworm/src/core/collisions.ts`: the cross-group duplicate rule
- `packages/svgworm/src/core/assemble/sprite.ts`: per-group assembly
- `packages/svgworm/src/core/emit/manifest.ts`, `packages/svgworm/src/core/emit/module.ts`: several `sprites.<group>` entries
- `packages/svgworm/src/core/write.ts`: `OWNED_FILE` built from the group names, pruning of renamed groups
- `packages/svgworm/src/core/check.ts`, `packages/svgworm/src/cli/reporters/*`: per-group stats and diffs
- `packages/svgworm/svgworm.schema.json`: regenerated
- `docs/output-contract.md`, `apps/site/src/content/docs/config.md`, `llms.txt`, `skills/*/SKILL.md`

## Risks & Considerations

- A wider deletion pattern means svgworm deletes more kinds of files in the user's `outDir`. A group named like a user file is a data-loss risk. Keep group names strict, and prune only files listed in the previous manifest.
- The `crossOrigin: "inject"` loader (ADR-0027) is per build today. It needs one loader per group, or one loader for all groups.
- Contract change: additive per ADR-0012, but it still needs a semver note and a changeset.
- Effort is high for an audience that has not asked yet. Keep it parked until the ADR-0023 trigger fires.

## Open Questions

- Should an icon be allowed in two groups (duplicated bytes), or always be an error?
- Should folder grouping (neodx `group: true`) be a shortcut, given that ADR-0023 rejected namespace splitting?
- Should there be per-group `outDir` overrides, or one shared `outDir` only?

## Revision History
- [2026-10-31] Backlog grooming: trigger re-checked and still unmet (no GitHub issue on jmlweb/svgworm, nothing in `docs/metrics/manual.json`). Paths in Files to Modify verified on main 580c3ef (`OWNED_FILE` at `packages/svgworm/src/core/write.ts:11`). Left pending until a user reports the ADR-0023 trigger.
