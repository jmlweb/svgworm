# 0012. Freeze the v0.1 output contract

- **Status:** accepted
- **Date:** 2026-10-11
- **Task:** TSK-008
- **Resolves:** none new. Q-22, Q-25 and Q-30 stay deferred ([ADR-0005](0005-build-standalone-with-kill-criteria.md)). This ADR records the contract that ADR-0006, ADR-0007, ADR-0010 and ADR-0004 decided piece by piece.

## Context

`docs/output-contract.md` was a draft. Its decisions were spread over ADR-0004 (color), ADR-0006 (delivery and stack file), ADR-0007 (naming), and ADR-0010 (sprite URL, manifest, types). Its header still said "DRAFT", and it had open markers: Q-25 and Q-30 in the types and inline sections, and "working names" for the manifest keys.

The adapters (`@svgworm/react`, TSK-012) and the core (TSK-011) both need a fixed boundary before they are written. Once the contract is public, changing it is a breaking change.

TSK-008 scoped v0.1 as "one sprite, the manifest with `color`, and types", and said the per-icon `delivery` field (Q-05) was deferred. That was written before ADR-0006 and ADR-0010. Both need the field in v0.1: `use` cannot render icons with `url(#…)` references in WebKit or Firefox, so the manifest must tell adapters which of the two files to read.

## Options considered

1. **Freeze the draft as is, with the spike-era field names.** Fast. It keeps the working names and the deferred markers, so the first consumer would churn the contract.
2. **Freeze the contract now, with the exported type names fixed, no open markers, and a 0.x policy.** It binds the core and the adapters to the same names before they exist. A rename later is a breaking change, which the 0.x policy allows as a minor bump.
3. **Keep it a draft until TSK-011 ships.** The core would be designed around the draft, so the contract would be whatever the first implementation happens to do.

## Decision

Option 2. `docs/output-contract.md` is the v0.1 contract, with these rules:

- **Scope:** one sprite group `icons`. The manifest carries `color` and `delivery` per icon. Sprite and stack files are both in scope. Multiple groups, per-namespace types, and inline output are out of v0.1. This corrects the TSK-008 description on Q-05, following ADR-0006 and ADR-0010.
- **Names frozen:** the manifest keys, the file naming rule `<group>.<hash>.svg` and `<group>.stack.<hash>.svg`, and the exported types `IconName`, `SvgwormFile`, `SvgwormIcon`, `SvgwormManifest`, and `manifest`.
- **0.x policy:** until `1.0.0`, a breaking change to the contract is a minor bump with a "Breaking" changeset note ([ADR-0009](0009-license-versioning-and-release.md)). The manifest `version` (`1`) changes only when the manifest format changes. Adapters fail loudly on a version they do not know.
- **Evidence for the sample:** `docs/samples/output-contract-v0.1/` holds the output of the TSK-004 spike generator for four icons that cover all three delivery forms. The core must reproduce it byte for byte (TSK-011).

## Evidence

- [ADR-0010](0010-sprite-url-delivery-generated-module-and-public-path.md) and `spikes/TSK-004-sprite-url`: 36/36 checks in plain HTML, Next 16, and Next with `basePath`, in Chromium, Firefox, and WebKit with JavaScript off. The spike generator produced the sample.
- [ADR-0007](0007-icon-naming-and-collision-policy.md) and `spikes/TSK-006-icon-naming/check.mjs`: the example table in the contract is checked against the naming code.
- [ADR-0006](0006-per-icon-delivery-external-use-and-svg-stack.md) and `spikes/TSK-002-external-use`: why `use`, `img` and `mask` are all in v0.1.
- [ADR-0004](0004-per-icon-color-classification.md): mono and multicolor classification, 99.98% on 31k icons.
- The sample is not yet produced by product code. Until TSK-011, it is the spike's output. Only the core can make it a passing test.

## Consequences

- The core and `@svgworm/react` can be built against fixed names. A rename or a new required field is a breaking change and needs an ADR plus a changeset.
- The sample is the first snapshot. TSK-011 must match it, and a change to it needs review like a snapshot.
- The contract allows only one sprite group. Multi-sprite (Q-22) will need a new ADR, and it will add a group key, not change the existing ones.
- Dropping per-icon `delivery` from v0.1 would break Firefox and WebKit rendering of gradients, clip paths, and masks. It is not an option for a later release without a new ADR that changes ADR-0006.
- `1.0.0` needs its own ADR, once the contract has been used by at least one real project.
