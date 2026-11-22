---
id: RPT-018
title: check reports a directory or symlink with a sprite-like name as stale, but build never removes it, so check can never pass
type: bug
severity: low
status: triaged
created: 2026-11-21
triaged: 2026-11-21
task-id: TSK-112
---

## Summary

`build` and `check` disagree on which entries in `outDir` are stale. `build` skips a directory or symlink whose name matches the owned-file pattern. `check` lists it as stale and exits 1, telling the user to run `svgworm build`. Running `build` changes nothing, so `check` keeps failing (in CI too) with no way to make it pass short of deleting the entry by hand.

## Where

- `packages/svgworm/src/core/write.ts:70`: `removeStale` keeps only regular files: `if (!(await lstat(path)).isFile()) continue;` ("A directory or symlink with a matching name is not ours").
- `packages/svgworm/src/core/check.ts:124`: `findStaleSprites` filters by name only (`isOwnedFile(name) && !kept.has(name)`), with no `lstat` check.

## Reproduction (main 0ac192e, after `pnpm build`)

```sh
mkdir -p /tmp/repro/icons && cd /tmp/repro
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24z"/></svg>' > icons/a.svg
mkdir -p public/icons/icons.deadbeef.svg
node <repo>/packages/svgworm/bin/svgworm.js build; echo "build $?"
node <repo>/packages/svgworm/bin/svgworm.js check; echo "check $?"
```

Observed:

```
build 0
check public/icons/icons.deadbeef.svg stale
svgworm: output is stale (1 file(s)). Run "svgworm build" and commit the result
check 1
```

The directory is still there after `build`. The same happens with a symlink, for example `ln -s /etc/hostname public/icons/icons.cafebabe.svg`: `build` exits 0 and leaves it, then `check` exits 1.

Expected: `check` applies the same rule as `build` (only regular files are stale), so `check` passes right after a successful `build`.

## Notes

- Low severity: it needs an entry with a hashed-sprite name that is not a regular file. The fix is one shared predicate used by both functions.
- Not covered by a pending report, task or learning (`learning-search` for "stale" and "symlink" finds nothing on this; LRN-042 is about source discovery).
