---
id: RPT-012
title: A config file containing JSON null is accepted as an empty config
type: bug
severity: low
status: triaged
created: 2026-11-03
triaged: 2026-11-03
task-id: TSK-106
---

## Observed

`loadConfig` in `packages/svgworm/src/core/config/resolve.ts:240-243` merges the parsed file as:

```ts
const merged = isFileObject
  ? { ...fromFile, ...options.overrides }
  : (fromFile ?? { ...options.overrides });
```

For a file whose content is `null`, `fromFile ?? …` falls through to the overrides, so `null` never reaches `configSchema` and the build runs on defaults. Any other non-object (`42`, `false`, `[]`, `"x"`) is rejected by zod with exit 2. Principle 5 (fail loudly) and the config boundary expect an `Invalid configuration` error here too.

## Reproduction

```sh
pnpm build
mkdir -p /tmp/nullcfg/icons && cp fixtures/<any>/*.svg /tmp/nullcfg/icons/   # any valid SVG
cd /tmp/nullcfg && echo null > svgworm.config.json
node <repo>/packages/svgworm/dist/cli/main.js build; echo $?
# svgworm: using default source icons/ ... svgworm: build done; exit 0
```

## Expected

Exit 2 with `Invalid configuration` (expected object, received null), as for `[]` or `42`. A unit test in `resolve.test.ts` for a `null` file.
