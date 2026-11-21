---
id: RPT-017
title: An internal reference to an id the icon does not define builds silently and the icon renders blank
type: bug
severity: medium
status: triaged
created: 2026-11-21
triaged: 2026-11-21
task-id: TSK-111
---

## Summary

An icon whose `href="#x"` or `url(#x)` points at an id that does not exist in the file builds with no error and no warning. The dangling reference is copied into the sprite as is, and the icon renders empty (or without the referenced paint). This goes against principle 5 ("invalid SVGs ... produce clear errors, never silent").

## Where

- `packages/svgworm/src/core/svg/ids.ts:42`: `renameReference` falls back to the original id (`mapping.get(id) ?? id`) when the target is not defined, so the reference is kept verbatim instead of being reported.
- `packages/svgworm/src/core/svg/validate.ts:114` (`validateTree`): checks external references, forbidden elements and attributes, but no check that an internal `#id` target exists.

## Reproduction (main 0ac192e, after `pnpm build`)

```sh
mkdir -p /tmp/repro/icons && cd /tmp/repro
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><use href="#missing"/></svg>' > icons/danglingref.svg
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="url(#grad)" d="M0 0h24v24z"/></svg>' > icons/danglingfill.svg
node <repo>/packages/svgworm/bin/svgworm.js build --json | jq -c '{ok, warnings}'
cat public/icons/*.svg
```

Observed:

```
{"ok":true,"warnings":[]}
<svg ...><symbol id="i-danglingref" viewBox="0 0 24 24"><use href="#missing"/></symbol></svg>
<svg ...><style>...</style><svg id="i-danglingfill" viewBox="0 0 24 24"><path fill="url(#grad)" d="M0 0h24v24z"/></svg></svg>
```

The manifest lists `danglingfill` as `"color":"mono","delivery":"mask"` and `danglingref` as `"delivery":"use"`. Both render nothing in the browser: `<use>` has no target, and a `url(#grad)` paint with no fallback paints none. The user gets exit code 0 and blank icons.

Expected: a diagnostic naming the file, the element and the missing id (an error per principle 5, or at least a warning), for `href`/`xlink:href`, `url(#…)` in attributes and `style`, and SMIL `begin`/`end` id references.

## Notes

- Not covered by an existing report, task or learning (`learning-search --query "dangling reference"` finds nothing relevant).
- A kept, un-renamed id also escapes the per-icon id namespace (LRN-012): a dangling `url(#i-other_1)` would resolve to another icon's element in the shared sprite.
