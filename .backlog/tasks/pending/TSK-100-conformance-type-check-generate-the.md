---
id: TSK-100
title: Conformance type check: generate the icons fixture from the core build
status: pending
priority: P4
tags: [testing, conformance, types]
created: 2026-10-16
source: manual
depends-on: []
---

# Conformance type check: generate the icons fixture from the core build

## Description

Follow-up from TSK-092. `tests/conformance/types/svgworm/icons.{js,d.ts}` is hand-written in the shape of the output contract, so it can drift from what svgworm really generates and the vue-tsc / svelte-check run would no longer prove that generated types work with the generated components. Generate it from the core build (`build` from the svgworm public entry) in the test setup instead.

## Acceptance Criteria

- [ ] tests/conformance/tests/types.test.ts builds a fixture icon folder with the core API and writes icons.js and icons.d.ts before running vue-tsc and svelte-check
- [ ] The hand-written tests/conformance/types/svgworm/ fixture and its oxlint/oxfmt ignore entries are removed
- [ ] Removing the expected-error marker still makes both checkers fail

## Notes

## Learnings

## Progress Log

- [2026-10-16] Created