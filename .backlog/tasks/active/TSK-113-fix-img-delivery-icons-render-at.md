---
id: TSK-113
title: Fix: img-delivery icons render at 1x1 px by default because width="1em" is not a valid img dimension
status: blocked
priority: P2
tags: []
created: 2026-11-24
source: report/RPT-019
depends-on: []
started: 2026-11-27
blocked-by: criterion 6: pnpm render:check cannot finish locally because Playwright WebKit is missing system libraries (libevent-2.1-7t64, libavif16); Chromium and Firefox pass 57/0/4, the script renders its own markup so the matrix is unaffected, CI must confirm. All other gates pass.
---

# Fix: img-delivery icons render at 1x1 px by default because width="1em" is not a valid img dimension

## Description

From RPT-019. The adapters default `width`/`height` to `'1em'` and pass them as HTML attributes of the `<img>` used for `delivery: "img"` icons (`packages/react/src/create-icon.tsx:71` and `:164`; the templates in `packages/svgworm/src/cli/init/plan.ts` and `apps/site/src/components/Icon.astro:137`). HTML dimension attributes parse `1em` as 1 px, so multicolor img icons are 1 x 1 px by default (observed in Chromium and Firefox). Move the default size into CSS. Note the trade-off: inline style beats a class rule, which `icon.md` says resizes img icons. Change touches the adapters and the generated templates: run the core/adapter gate set from `.claude/rules/agent-workflow.md`.

## Acceptance Criteria

- [x] A failing test first shows that the default-size img delivery of createIcon renders an img that is not 1em square in a browser (or asserts the size moves out of the HTML width/height attributes)
- [x] createIcon in packages/react/src/create-icon.tsx, the Icon.astro, Icon.vue and Icon.svelte templates in packages/svgworm/src/cli/init/plan.ts and apps/site/src/components/Icon.astro render a default-size img icon at 1em x 1em, and the conformance tests stay green
- [x] Explicit numeric and string width/height props still size img icons as documented
- [x] A CSS class rule still resizes img icons, or the sizing section of apps/site/src/content/docs/icon.md is updated to say otherwise; the img markup example in icon.md matches the new output
- [x] Changesets record the fix for svgworm and @svgworm/react
- [ ] pnpm verify, pnpm determinism:fingerprint, pnpm example:check, pnpm example:vite:check, pnpm site:check and pnpm render:check pass

## Notes

## Learnings

- LRN-072: img width/height attributes parse 1em as 1px; size img icons with CSS
## Progress Log

- [2026-11-24] Created
- [2026-11-27] Started
- [2026-11-27] criterion 1 — evidence: new tests in packages/react/src/create-icon.test.tsx (no width/height attribute on the img, style="width:1em;height:1em") failed 4/31 before the fix, pass after; Playwright Chromium and Firefox at font-size 32px: old markup 1x1, new markup 32x32 (2026-11-27)
- [2026-11-27] criterion 2 — evidence: createIcon, the Astro/Vue/Svelte templates in plan.ts and the regenerated apps/site/src/components/Icon.astro render style="width:1em;height:1em"; pnpm test → 50 files, 964 passed incl. both conformance suites with new img size cases (2026-11-27)
- [2026-11-27] criterion 3 — evidence: tests 'sizes the img from numeric and string width and height props' (width:32px;height:16px, width:1.5rem;height:1.5rem) and conformance cases 'img, numeric size and style' / 'img, string size' pass; Playwright 20px style → 20x20 (2026-11-27)
- [2026-11-27] criterion 4 — evidence: icon.md img markup now matches the new output and the Sizing section says a class rule resizes svg icons only; img and mask need the props or style (2026-11-27)
- [2026-11-27] criterion 5 — evidence: .changeset/img-icon-css-size.md records a patch for svgworm and @svgworm/react (2026-11-27)
- [2026-11-27] Blocked: criterion 6: pnpm render:check cannot finish locally because Playwright WebKit is missing system libraries (libevent-2.1-7t64, libavif16); Chromium and Firefox pass 57/0/4, the script renders its own markup so the matrix is unaffected, CI must confirm. All other gates pass.