---
id: RPT-010
title: Generated Icon.vue renders nothing instead of throwing on an unknown name under NODE_ENV=production
type: bug
severity: low
status: triaged
created: 2026-10-31
triaged: 2026-10-31
task-id: TSK-103
---

## Summary

The `Icon.vue` that `svgworm init` writes throws `Unknown icon "…"` inside a `computed` (`packages/svgworm/src/cli/init/plan.ts:1074`). With `NODE_ENV=production`, Vue's production runtime catches that render error and does not rethrow it: `renderToString` resolves `""`. The docs say the component throws (`apps/site/src/content/docs/icon.md:109`: "At runtime (an untyped name, or a stale manifest) the component throws `Unknown icon "…"`"). That holds for `@svgworm/react` and `Icon.svelte`, but not for `Icon.vue` in a production Vue/Nuxt SSR build, where an unknown name silently renders nothing (principle 5: fail loudly).

The same gap makes `pnpm test` fail on any machine that exports `NODE_ENV=production`, because the conformance tests assert the throw.

## Reproduction

On main 580c3ef, after `pnpm install` and `pnpm build`, in `tests/conformance`:

```
$ NODE_ENV=production pnpm exec vitest run tests/icon-conformance.test.ts
 FAIL  tests/icon-conformance.test.ts > Icon.vue matches createIcon > throws on the unknown name "nope"
 FAIL  tests/icon-conformance.test.ts > Icon.vue matches createIcon > throws on the unknown name "constructor"
 FAIL  tests/icon-conformance.test.ts > Icon.vue matches createIcon > throws when the delivery needs a file the manifest lacks
AssertionError: promise resolved "''" instead of rejecting
 ❯ tests/icon-conformance.test.ts:230:41
      Tests  3 failed | 31 passed (34)

$ env -u NODE_ENV pnpm exec vitest run tests/icon-conformance.test.ts
      Tests  34 passed (34)
```

The Svelte cases of the same file pass under `NODE_ENV=production`. CI is green because `.github/workflows/ci.yml` never sets `NODE_ENV`.

## Impact

- Vue users on a production build get an empty render, not the documented error, for an untyped name or a stale manifest (the type check still catches typed names).
- The conformance suite only proves the throw in Vue's development mode, and fails locally under `NODE_ENV=production`.

## Possible fix

Either document that Vue swallows the error in production (and pin `NODE_ENV` for the conformance run), or make the Vue template's failure visible in production too, then run the conformance tests in both modes.
