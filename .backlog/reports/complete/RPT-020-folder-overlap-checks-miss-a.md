---
id: RPT-020
title: Folder overlap checks miss a child folder whose name starts with two dots, so moduleDir is written into the served outDir
type: bug
severity: low
status: triaged
created: 2026-11-27
triaged: 2026-11-27
task-id: TSK-114
---

## What happens

`resolveConfig` rejects a `moduleDir` inside `outDir` ("served to browsers"), an `outDir` inside a source folder, and overlapping sources. All three checks share `isInside` (`packages/svgworm/src/core/config/resolve.ts:48-51`):

```ts
const path = relative(parent, child);
return path === '' || (!path.startsWith('..') && !isAbsolute(path));
```

`relative('public/icons', 'public/icons/..gen')` is `'..gen'`, which starts with `..`, so a child folder named `..gen` (or any name starting with two dots) counts as outside its parent. The checks at `resolve.ts:112`, `:120` and `:125` then pass.

## Reproduction (main da8160c, after `pnpm build`)

```sh
D=$(mktemp -d) && cd $D && mkdir icons
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24z"/></svg>' > icons/a.svg
node <repo>/packages/svgworm/dist/cli/main.js build --out-dir public/icons --module-dir public/icons/gen
# exit 2: moduleDir: "public/icons/gen" is inside outDir "public/icons", which is served to browsers
node <repo>/packages/svgworm/dist/cli/main.js build --out-dir public/icons --module-dir 'public/icons/..gen'
# exit 0:
# write public/icons/icons.15013e7d.svg (135 B)
# write public/icons/..gen/icons.js (407 B)
# write public/icons/..gen/icons.d.ts (670 B)
# write public/icons/..gen/manifest.json (344 B)
```

The same predicate lets `--out-dir 'icons/..out'` (inside the `icons` source) through with exit 0. Discovery skips dot folders, so the next build still reads 1 SVG there; the moduleDir case is the one with a visible effect (the manifest is published under the site root).

## Fix

Treat only `..` itself or a `..` path segment as leaving the parent: `path === '..' || path.startsWith('..' + sep)` (plus `isAbsolute`). The same pattern is in `packages/svgworm/src/cli/migrate/project.ts:36-38` and `packages/svgworm/src/cli/init/plan.ts:1433`; check them in the same change. Start with a failing test in `resolve.test.ts` for a `..`-prefixed child folder.
