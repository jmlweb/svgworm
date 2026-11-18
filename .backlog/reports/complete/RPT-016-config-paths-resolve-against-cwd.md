---
id: RPT-016
title: Config paths resolve against cwd, not the config file, though docs say relative to the config
type: bug
severity: medium
status: triaged
created: 2026-11-18
triaged: 2026-11-18
task-id: TSK-110
---

## What

The config docs say source folders are relative to the config file, but `loadConfig` resolves every config path against the working directory. A config passed with `--config` from another folder therefore looks for its sources in the wrong place.

- `packages/svgworm/src/core/config/schema.ts:110` (`dir` description, shipped in `svgworm.schema.json`): "Folder with the SVG files, relative to the config."
- `packages/svgworm/src/core/config/schema.ts:135`: `sources` "relative to the config".
- `apps/site/src/content/docs/config.md:56`: "**`dir`:** the folder, relative to the config."
- `packages/svgworm/src/core/config/resolve.ts:250`: `resolveConfig(merged, options.cwd)` gets cwd, never the config file's folder; `resolve.ts:109` resolves each source with `resolve(absoluteCwd, source.dir)`. `outDir` and `moduleDir` follow the same cwd base.

## Reproduction

```sh
D=$(mktemp -d); mkdir -p $D/sub/icons
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>' > $D/sub/icons/home.svg
printf '{"sources":["icons"],"outDir":"public/icons"}' > $D/sub/svgworm.config.json
cd $D && node <repo>/packages/svgworm/dist/cli/main.js --config sub/svgworm.config.json
```

Observed (main b79816f):

```
svgworm: source folder not found: icons
exit=2
```

`sub/icons/home.svg` exists. The docs predict that the build reads it.

## Expected

Either config paths resolve against the config file's folder, as documented, or the docs and the schema descriptions say "relative to the working directory". The behaviour is a public contract (config docs, JSON Schema, `llms.txt`), so the choice needs a decision. ADR-0029 already fixes the default `icons` folder as relative to the working directory.

## Not covered by

TSK-107 (an absolute `--config` path is joined to cwd) is a different defect in `readConfigFile`. This report is about the relative paths inside a config loaded from another folder.
