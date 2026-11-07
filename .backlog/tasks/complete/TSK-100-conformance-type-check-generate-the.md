---
id: TSK-100
title: Conformance type check: generate the icons fixture from the core build
status: complete
priority: P4
tags: [testing, conformance, types]
created: 2026-10-16
source: manual
depends-on: []
started: 2026-11-06
completed: 2026-11-06
---

# Conformance type check: generate the icons fixture from the core build

## Description

Follow-up from TSK-092. `tests/conformance/types/svgworm/icons.{js,d.ts}` is hand-written in the shape of the output contract, so it can drift from what svgworm really generates and the vue-tsc / svelte-check run would no longer prove that generated types work with the generated components. Generate it from the core build (`build` from the svgworm public entry) in the test setup instead.

## Acceptance Criteria

- [x] tests/conformance/tests/types.test.ts builds a fixture icon folder with the core API and writes icons.js and icons.d.ts before running vue-tsc and svelte-check — evidence: pnpm exec vitest run tests/types.test.ts → 2 passed (fails without the build) (2026-11-06)
- [x] The hand-written tests/conformance/types/svgworm/ fixture and its oxlint/oxfmt ignore entries are removed — evidence: pnpm verify → exit 0, 890 tests passed (2026-11-06)
- [x] Removing the expected-error marker still makes both checkers fail — evidence: markers removed → vue-tsc and svelte-check report TS2322 "nope" not assignable to "home" (2026-11-06)

## Notes

## Learnings

- LRN-064: NODE_ENV=production makes the Vue conformance throw tests fail locally
## Progress Log

- [2026-10-16] Created
- [2026-11-06] Started
- [2026-11-06] criterion 1 — evidence: tests/conformance/tests/types.test.ts copies fixtures/mono-fill/heroicons-home.svg to types/icons/home.svg and runs build(resolveConfig({}, types)) before vue-tsc and svelte-check; deleting the hand-written fixture first made both tests fail, with the build both pass (pnpm exec vitest run tests/types.test.ts → 2 passed) (2026-11-06)
- [2026-11-06] criterion 2 — evidence: tests/conformance/types/svgworm/ deleted, its ignore entries removed from oxlint.config.ts and oxfmt.config.ts, the build output folders gitignored in tests/conformance/.gitignore; pnpm verify → exit 0, 890 tests passed (2026-11-06)
- [2026-11-06] criterion 3 — evidence: with the @vue-expect-error and @ts-expect-error lines removed, vue-tsc → App.vue(9,9) TS2322 '"nope"' is not assignable to type '"home"', svelte-check → svelte-props.ts 8:33 same error, 1 ERRORS; both vitest cases fail (2026-11-06)
- [2026-11-06] Completed