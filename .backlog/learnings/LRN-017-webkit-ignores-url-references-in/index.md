---
id: LRN-017
title: WebKit ignores url(#...) references in external use sprites
status: active
tags: [browser, svg, sprite, webkit, delivery, testing]
task: TSK-002
created: 2026-10-07
---

## Context
TSK-002 rendered fixtures via `<use href="sprite.svg#id">` in Playwright Chromium 145, Firefox 146, WebKit 26.
## Insight
WebKit drops gradients, clipPath, masks and filters from external sprites, whether defined in the symbol or at the sprite root; same icons render inline or as `<img>`. Firefox fails only on a mask whose content is a `<use>`. Raw `<style>` in an external sprite leaks across symbols in Chromium and is ignored elsewhere. An SVG stack (`<img src="stack.svg#id">`, or CSS mask + currentColor for mono) renders everything in all three with zero JS. Firefox can't take transparent element screenshots: recover alpha from white and black page screenshots.
## Application
Never assume an external-sprite feature works because Chromium renders it. Route icons with url(#) references to the stack. Compare renders within one engine, never across engines. Check real Safari/iOS by hand (Playwright WebKit is not the Safari binary). See WebKit bug 105904.
