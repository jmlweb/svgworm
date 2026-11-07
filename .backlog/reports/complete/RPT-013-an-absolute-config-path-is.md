---
id: RPT-013
title: An absolute --config path is reported as not found although the file exists
type: bug
severity: low
status: triaged
created: 2026-11-06
triaged: 2026-11-06
task-id: TSK-107
---

## Observed

`readConfigFile` in `packages/svgworm/src/core/config/resolve.ts:205` builds the path with `join(cwd, configFile ?? DEFAULT_CONFIG_FILE)`. `path.join` does not treat an absolute second argument as absolute, so `--config /abs/file.json` becomes `<cwd>/abs/file.json`. The error then says the file is missing, although it exists.

## Reproduction (main d78c9d2, after `pnpm build`)

```
mkdir -p /tmp/p/proj/icons && cd /tmp/p/proj
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24z"/></svg>' > icons/a.svg
echo '{"sources":["icons"]}' > ../cfg.json
node <repo>/packages/svgworm/bin/svgworm.js build --config /tmp/p/cfg.json
# svgworm: Config file not found: /tmp/p/cfg.json   (exit 2)
node <repo>/packages/svgworm/bin/svgworm.js build --config ../cfg.json
# build done (exit 0)
```

The same `loadConfig` call serves `check` and `watch`, and the Vite plugin's `configFile` option (`packages/svgworm/src/vite/plugin.ts:172`), so an absolute path fails there too.

## Expected

`--config <file>` is documented without restriction (`packages/svgworm/src/cli/help.ts:21`, `apps/site/src/content/docs/cli.md:24`). Either resolve the path with `resolve(cwd, configFile)` so absolute paths work, or reject an absolute path with a message that says so. `init` already rejects it on purpose with "must be relative to the project folder" (`packages/svgworm/src/cli/init/plan.ts:1479`); `build` gives a false "not found". No test in `packages/svgworm/src/core/config/resolve.test.ts` covers an absolute `configFile`.
