# 0023. Several sprites through one config per sprite, no built-in groups yet

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-021
- **Resolves:** Q-22

## Context

Q-22 asks whether sprites should be split by namespace, by config groups, or both, and whether there is a default size limit. One sprite holds every icon, so the first visit pays for the whole set. The contract was built to grow: the manifest has `sprites.<group>` and every icon names its group in `icons.<name>.sprite`, so adapters already resolve the file per icon ([ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md), [ADR-0012](0012-output-contract-v0.1.md): multi-sprite "will add a group key, not change the existing ones").

Sizes measured with the built core on 2026-10-15:

| Set | Icons | Sprite raw | gzip -9 |
| --- | ---: | ---: | ---: |
| This site | 21 | 10.7 KiB | — |
| `lucide-static@0.545.0`, every icon | 1,866 | 538.8 KiB | 75.0 KiB |
| 40 Lucide icons (an "app" set) | 40 | — | 1.6 KiB |
| 20 Lucide icons (a "marketing" set) | 20 | — | 1.1 KiB |

A typical app uses tens of icons, where one sprite is a single small, year-cached request. The split pays off only for sets in the hundreds where pages use disjoint subsets.

## Options considered

1. **Namespace splitting** (each top-level folder is a sprite).
   - Cons: folder layout is chosen for naming, not for loading, so the split would rarely match the pages. Changing a folder would move icons between files. Rejected.
2. **Config groups in one build** (`"sprites": { "app": [...], "marketing": [...] }`).
   - Pros: one `IconName` type and one `Icon` component across groups; adapters need no change.
   - Cons: the R-15 ownership pattern (`^icons(\.stack)?\.<hash>\.svg$`) must widen to every configured group name, so svgworm deletes more kinds of files in the user's `outDir`, and a renamed group leaves files it no longer owns. It adds a config surface, group-level collision rules (an icon in two groups), per-group stats in every reporter and `check` output, all before anyone has asked for it.
3. **One config per sprite, documented** (works today).
   - Each sprite gets its own config file with its own `sources`, `outDir`, `publicPath` and `moduleDir`, built with `svgworm --config <file>`. Each produces its own manifest and `IconName`, and the app makes one component per manifest (`createIcon(appManifest)`, `createIcon(marketingManifest)`).
   - Pros: no new code, no wider deletion pattern; types stay exact per sprite.
   - Cons: two components and two build commands; the same icon in both sets is duplicated on disk. The `outDir`s must differ, because both builds name their files `icons.<hash>.svg` and each prunes the other's.

## Decision

Option 3 now. No built-in groups and no size limit or warning. The docs gain a "Several sprites" section in the config reference with the two-config recipe and the separate-`outDir` rule. Built-in config groups (option 2) stay possible later without breaking adapters, because the manifest already carries the group per icon.

Reopen when a user reports a set where the recipe falls short: one component across sprites, an icon shared by groups, or per-route sprites a recipe cannot express.

## Evidence

- Size table above: `svgworm --source icons` over `lucide-static@0.545.0` (1,866 icons), and the 40/20 split, gzip with `gzip -9`.
- The recipe, run with the built CLI: two configs (`icons/app` → `public/icons/app`, `/icons/app`, `svgworm/app`; `icons/marketing` → `public/icons/marketing`, `/icons/marketing`, `svgworm/marketing`) build two sprites and two manifests, and `svgworm check --config <each>` reports both up to date.
- `packages/svgworm/src/core/write.ts` (`OWNED_FILE`): the fixed `icons` prefix is what lets two builds share nothing but a parent folder; option 2 would have to widen it.

## Consequences

- No change to the output contract, CLI or config. R-44 is met per sprite, not across sprites.
- `docs/output-contract.md`, `docs/requirements.md`, the site docs, `llms.txt` and both skills describe the recipe instead of "planned".
