---
id: TSK-103
title: Fix: Generated Icon.vue renders nothing instead of throwing on an unknown name under NODE_ENV=production
status: complete
priority: P4
tags: [vue, init, conformance, testing]
created: 2026-10-31
source: report/RPT-010
depends-on: []
started: 2026-11-18
completed: 2026-11-18
---

# Fix: Generated Icon.vue renders nothing instead of throwing on an unknown name under NODE_ENV=production

## Description

The `Icon.vue` template (`packages/svgworm/src/cli/init/plan.ts:1074`) throws `Unknown icon "…"` inside a `computed`. Vue's production runtime swallows that render error, so `renderToString` resolves `""`, while `apps/site/src/content/docs/icon.md:109` says the component throws. Under `NODE_ENV=production`, three cases in `tests/conformance/tests/icon-conformance.test.ts` (lines 230 and 235) fail; with `NODE_ENV` unset all 34 pass. Svelte and React are unaffected. Decide whether to make the Vue failure visible in production or to document it, and make the conformance run cover both modes. Check the Vue error-handling API in its docs (Context7) before relying on it. Template changes need `pnpm verify` and `pnpm site:check`.

## Acceptance Criteria

- [x] A conformance test runs the Icon.vue unknown-name and missing-stack cases with Vue in production mode and states the expected result
- [x] pnpm test passes with and without NODE_ENV=production
- [x] Either Icon.vue fails visibly in a production Vue build, or apps/site/src/content/docs/icon.md states the Vue production behaviour
- [x] If the template in packages/svgworm/src/cli/init/plan.ts changes, a changeset records it

## Notes

## Learnings

- LRN-069: Vitest test.env cannot pin a dependency's development or production build
## Progress Log

- [2026-10-31] Created
- [2026-11-18] Started
- [2026-11-18] criterion 1 — evidence: env -u NODE_ENV pnpm test → project conformance-production (tests/conformance/vitest.production.config.ts, NODE_ENV=production + --conditions production) runs 'Icon.vue in a Vue production build': unknown names nope/constructor and missing stack file render '' and log via console.error, reach app.config.errorHandler, and throw with throwUnhandledErrorInProduction; 9 tests pass (2026-11-18)
- [2026-11-18] criterion 2 — evidence: NODE_ENV=production pnpm test → 940 passed, 6 skipped; env -u NODE_ENV pnpm test → 934 passed, 12 skipped; 0 failures in both (2026-11-18)
- [2026-11-18] criterion 3 — evidence: apps/site/src/content/docs/icon.md Errors gains 'Vue in production' (renders nothing, errorHandler or console.error, throwUnhandledErrorInProduction opt-in; Vue 3.5 runtime-core.cjs.prod.js logError throws only when throwInProd); the template cannot escape Vue's handler, so documented; pnpm site:check → exit 0 (2026-11-18)
- [2026-11-18] criterion 4 — evidence: git diff --name-only main → no packages/svgworm/src/cli/init/plan.ts, template unchanged, so no changeset (site docs and tests only; site is private) (2026-11-18)
- [2026-11-18] Completed