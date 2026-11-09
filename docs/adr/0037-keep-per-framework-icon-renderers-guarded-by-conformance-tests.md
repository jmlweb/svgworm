# 0037. Keep per-framework Icon renderers, guarded by conformance tests

- **Status:** accepted
- **Date:** 2026-11-09
- **Task:** TSK-101
- **Resolves:** no open question; the duplication ADR-0017 and ADR-0034 accepted (PR #14 review)

## Context

The manifest types and the `use` / `img` / `mask` delivery logic live in four places: `createIcon` in `@svgworm/react`, and the `Icon.astro` (ADR-0017), `Icon.vue` and `Icon.svelte` (ADR-0034) templates that `svgworm init` writes from `packages/svgworm/src/cli/init/plan.ts`. Every delivery change touches four files. The conformance tests in `apps/site` and `tests/conformance` catch drift, but they do not remove the work.

The question is whether one shared, dependency-free implementation is worth an output-contract change.

## Options considered

1. **A dependency-free helper generated into `moduleDir`.** The templates import it next to the manifest. Pros: one copy of the pure logic (version check, lookup, file URL, viewBox size, a11y choice, mask style) for the generated components, and fixes reach them on the next build. Cons: a new generated file is an output-contract change (a semver note, determinism and snapshot coverage). `@svgworm/react` cannot use it: the published adapter may not import `svgworm` (ADR-0008) or a file in the user's project, so it would need a new `createIcon(manifest, helper)` API, and there would still be two sources. It couples a file that every build rewrites with `Icon.*` files that `init` writes once and the user owns, so the helper would need a versioned API of its own. It removes about 40 lines per template and leaves the framework-bound half.
2. **A shared template fragment in `plan.ts`**, as `LOADER_TYPES` already is (ADR-0036). Pros: no contract change, no new file. Cons: it only removes copies inside `plan.ts`; React keeps its copy. Only the manifest types are byte-identical in the three templates, so sharing more changes the generated files.
3. **Keep the duplication**, with the conformance tests as the guard. Pros: each component stays self-contained and idiomatic, with no dependency and no import beyond the manifest. Cons: a delivery change still touches four renderers.

## Decision

No single source of truth across React, Astro, Vue and Svelte. The four renderers stay separate, and the conformance tests stay the drift guard (option 3). The output contract does not change.

Inside `plan.ts`, the manifest types block the three templates share byte for byte is one constant, `ICON_MANIFEST_TYPES` (option 2, limited to that block). The generated files do not change. The version check and `fileUrl` stay written out per template, because they reach the icon differently in each framework (`icon`, `icon.value`, `props.name`).

Revisit this if a fifth renderer is added, or if `@svgworm/react` gets a reason to accept injected delivery logic.

## Evidence

Spike [TSK-101](../../spikes/TSK-101-shared-icon-delivery/RESULTS.md) (2026-11-09):

- Of the distinct non-blank lines in the four renderers (136 Astro, 109 Vue, 118 Svelte, 153 React), 25 are common to all four: the manifest type declarations, markup and punctuation fragments, and a single line of the a11y choice. 43 are common to the three templates. Apart from that one line, no delivery logic is literally shared by all four.
- About 40 lines per renderer are pure logic a helper could hold. The rest is bound to the framework: reactivity (`computed`, `$derived`), attribute spreading, style handling (an object in React, serialized by hand in Astro, an array in Vue, a string in Svelte) and the markup.
- With `ICON_MANIFEST_TYPES` in place, the rendered `Icon.astro`, `Icon.vue`, `Icon.svelte` and both loader components are byte-identical to the previous output (`diff -r` of the output of `spikes/TSK-101-shared-icon-delivery/src/measure.ts`), and the conformance tests pass unchanged.

## Consequences

- No change for users: no new generated file, no new API, no changeset.
- A delivery change still touches `create-icon.tsx` and the three templates in `plan.ts`. The conformance tests fail until all four agree, as ADR-0034 set out.
- A change to the manifest shape touches two places, `create-icon.tsx` and `ICON_MANIFEST_TYPES`, instead of four.
