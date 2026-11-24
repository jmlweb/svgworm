---
id: TSK-113
title: Fix: img-delivery icons render at 1x1 px by default because width="1em" is not a valid img dimension
status: pending
priority: P2
tags: []
created: 2026-11-24
source: report/RPT-019
depends-on: []
---

# Fix: img-delivery icons render at 1x1 px by default because width="1em" is not a valid img dimension

## Description

From RPT-019. The adapters default `width`/`height` to `'1em'` and pass them as HTML attributes of the `<img>` used for `delivery: "img"` icons (`packages/react/src/create-icon.tsx:71` and `:164`; the templates in `packages/svgworm/src/cli/init/plan.ts` and `apps/site/src/components/Icon.astro:137`). HTML dimension attributes parse `1em` as 1 px, so multicolor img icons are 1 x 1 px by default (observed in Chromium and Firefox). Move the default size into CSS. Note the trade-off: inline style beats a class rule, which `icon.md` says resizes img icons. Change touches the adapters and the generated templates: run the core/adapter gate set from `.claude/rules/agent-workflow.md`.

## Acceptance Criteria

- [ ] A failing test first shows that the default-size img delivery of createIcon renders an img that is not 1em square in a browser (or asserts the size moves out of the HTML width/height attributes)
- [ ] createIcon in packages/react/src/create-icon.tsx, the Icon.astro, Icon.vue and Icon.svelte templates in packages/svgworm/src/cli/init/plan.ts and apps/site/src/components/Icon.astro render a default-size img icon at 1em x 1em, and the conformance tests stay green
- [ ] Explicit numeric and string width/height props still size img icons as documented
- [ ] A CSS class rule still resizes img icons, or the sizing section of apps/site/src/content/docs/icon.md is updated to say otherwise; the img markup example in icon.md matches the new output
- [ ] Changesets record the fix for svgworm and @svgworm/react
- [ ] pnpm verify, pnpm determinism:fingerprint, pnpm example:check, pnpm example:vite:check, pnpm site:check and pnpm render:check pass

## Notes

## Learnings

## Progress Log

- [2026-11-24] Created