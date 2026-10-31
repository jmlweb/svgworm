---
id: TSK-103
title: Fix: Generated Icon.vue renders nothing instead of throwing on an unknown name under NODE_ENV=production
status: pending
priority: P4
tags: [vue, init, conformance, testing]
created: 2026-10-31
source: report/RPT-010
depends-on: []
---

# Fix: Generated Icon.vue renders nothing instead of throwing on an unknown name under NODE_ENV=production

## Description

The `Icon.vue` template (`packages/svgworm/src/cli/init/plan.ts:1074`) throws `Unknown icon "…"` inside a `computed`. Vue's production runtime swallows that render error, so `renderToString` resolves `""`, while `apps/site/src/content/docs/icon.md:109` says the component throws. Under `NODE_ENV=production`, three cases in `tests/conformance/tests/icon-conformance.test.ts` (lines 230 and 235) fail; with `NODE_ENV` unset all 34 pass. Svelte and React are unaffected. Decide whether to make the Vue failure visible in production or to document it, and make the conformance run cover both modes. Check the Vue error-handling API in its docs (Context7) before relying on it. Template changes need `pnpm verify` and `pnpm site:check`.

## Acceptance Criteria

- [ ] A conformance test runs the Icon.vue unknown-name and missing-stack cases with Vue in production mode and states the expected result
- [ ] pnpm test passes with and without NODE_ENV=production
- [ ] Either Icon.vue fails visibly in a production Vue build, or apps/site/src/content/docs/icon.md states the Vue production behaviour
- [ ] If the template in packages/svgworm/src/cli/init/plan.ts changes, a changeset records it

## Notes

## Learnings

## Progress Log

- [2026-10-31] Created