---
id: RPT-021
title: A color rule that matches no icon is silently ignored, for example a file-style brand/*.svg glob
type: improvement
severity: low
status: triaged
created: 2026-11-27
triaged: 2026-11-27
task-id: TSK-115
---

## What happens

`color` rules are matched against the icon public name (`packages/svgworm/src/core/svg/color/overrides.ts:13`, `rules.findLast((rule) => posix.matchesGlob(name, rule.match))`). A rule that matches no icon does nothing, with no warning and exit 0. The likely mistake is a file-style glob: the `include`/`exclude` help in `packages/svgworm/src/core/config/schema.ts` (`GLOB_HELP`) uses `"arrows/*.svg"`, but a color rule needs `"brand/*"`, because names have no `.svg`. A typo in a folder name has the same silent result. Principle 5 ("fail loudly and early") argues for at least a warning.

## Reproduction (main da8160c, after `pnpm build`)

```sh
D=$(mktemp -d) && cd $D && mkdir -p icons/brand
echo '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e00" d="M0 0h24v24z"/></svg>' > icons/brand/logo.svg
for m in 'brand/*' 'brand/*.svg' 'brands/*'; do
  echo "{\"color\":[{\"match\":\"$m\",\"color\":\"preserve\"}]}" > svgworm.config.json
  node <repo>/packages/svgworm/dist/cli/main.js build --json | jq -c '[.ok, .icons[0].color, .warnings]'
done
# brand/*     -> [true,"multicolor",[]]   rule applied
# brand/*.svg -> [true,"mono",[]]         rule ignored, no warning
# brands/*    -> [true,"mono",[]]         rule ignored, no warning
```

An `exclude` glob that matches nothing is silent as well (`{"sources":[{"dir":"icons","exclude":["nothing/*.svg"]}]}` gives `warnings: []`), so the fix may cover both.

## Suggested fix

After classification in `compile.ts`, emit a `warning` diagnostic (the existing path at `packages/svgworm/src/core/compile.ts:168`/`:223`) for each color rule that matched no icon, naming the rule and, when it ends in `.svg`, saying that rules match names without the extension. A warning, not an error, keeps a rule for a temporarily removed icon from breaking the build. Snapshot the plain and `--json` output.
