---
id: RPT-011
title: CLI help still says --cdn-url is React and Astro only after TSK-099
type: bug
severity: low
status: triaged
created: 2026-11-03
triaged: 2026-11-03
task-id: TSK-105
---

## Observed

`svgworm --help` prints (`packages/svgworm/src/cli/help.ts:45-46`):

```
  --cdn-url <https-url>   Serve sprites from a CDN on another origin (crossOrigin: inject).
                          React and Astro only
```

Since TSK-099 (commit 50ca1b4, ADR-0036) `init --cdn-url` works for Vue and Svelte too. The site docs (`apps/site/src/content/docs/cli.md:211`, `vue.md:94`, `svelte.md:90`) and `llms.txt:30` already say so. The help text was not updated, so agents and users reading `--help` (principle 10) are told the flag is not available for Vue or Svelte.

## Reproduction

```sh
pnpm build
node packages/svgworm/dist/cli/main.js --help | grep -A1 cdn-url   # "React and Astro only"
# in a temp dir with package.json {"dependencies":{"vue":"3.5.0"}} and an icons/ folder:
node <repo>/packages/svgworm/dist/cli/main.js init --framework vue --cdn-url https://cdn.example.com/icons --yes --no-scripts
# writes components/Icon.vue and components/SvgwormLoader.vue
```

## Expected

The help line says the flag works for every framework (or lists React, Astro, Vue and Svelte), matching `cli.md`.
