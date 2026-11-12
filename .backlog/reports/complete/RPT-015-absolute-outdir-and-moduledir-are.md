---
id: RPT-015
title: Absolute outDir and moduleDir are written under cwd, and an absolute source is reported as not found
type: bug
severity: medium
status: triaged
created: 2026-11-12
triaged: 2026-11-12
task-id: TSK-109
---

## What happens

An absolute `outDir` or `moduleDir` (flag or config) is silently written to a mirror of that path under the project folder, and the build reports success. An absolute `sources` entry fails with "source folder not found" although the folder exists.

The core joins every configured path onto `cwd` with `path.join`, which does not reset on an absolute second argument:

- `packages/svgworm/src/core/write.ts:36`, `:61`, `:96`: `join(targets.cwd, targets[file.target])` / `join(targets.cwd, targets.outDir)`
- `packages/svgworm/src/core/discover.ts:107`: `join(cwd, source.dir)`
- `packages/svgworm/src/core/check.ts:96`, `:117`, `:146`: same pattern, so `check` compares against the mirrored path
- `packages/svgworm/src/core/watch.ts:146`: watches `join(config.cwd, source)`

`resolveConfig` (`packages/svgworm/src/core/config/resolve.ts:113-128`) validates the same paths with `path.resolve`, so the overlap checks ("outDir is inside a source folder", "moduleDir is inside outDir") inspect a different folder than the one the build writes to. `derivePublicPath` (`resolve.ts:66-68`) handles an absolute `outDir` on purpose (it asks for `publicPath`), so absolute paths pass validation and are not rejected.

Related but distinct: TSK-107 covers the same `join` mistake for `--config` only (`resolve.ts:205`).

## Reproduction (main 73024f2, Linux, Node 25)

```sh
D=$(mktemp -d); cd "$D"; mkdir icons; O=$(mktemp -d); M=$(mktemp -d); SRC=$(mktemp -d)
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>' > icons/a.svg
cp icons/a.svg "$SRC/z.svg"
node <repo>/packages/svgworm/bin/svgworm.js build --out-dir "$O" --public-path /icons --module-dir "$M"
find . -type f; find "$O" "$M" -type f
node <repo>/packages/svgworm/bin/svgworm.js build --source "$SRC"
```

Observed:

```
write tmp/tmp.8f6TZWKLBy/icons.eccffa3c.svg (137 B)
write tmp/tmp.8p0cvJdFPA/icons.js (407 B)
...
svgworm: build done            (exit 0)
-- in cwd:
./tmp/tmp.8f6TZWKLBy/icons.eccffa3c.svg
./tmp/tmp.8p0cvJdFPA/icons.js
...
-- in O and M: (nothing)
svgworm: source folder not found: /tmp/tmp.1ijAEeKQ9j   (exit 2)
```

## Expected

Either resolve configured paths with `path.resolve(cwd, p)` everywhere (and report them relative to `cwd`), or reject absolute `sources`, `outDir` and `moduleDir` in `resolveConfig` with a clear message. Never write to a different folder than the one validated and named by the user (principle 5, fail loudly).
