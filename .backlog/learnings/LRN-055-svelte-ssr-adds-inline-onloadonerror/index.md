---
id: LRN-055
title: Svelte SSR adds inline onload/onerror replay handlers to an img with spread attributes
status: active
tags: [svelte, ssr, csp, img, conformance]
task: TSK-092
created: 2026-10-16
---

## Context
The generated Icon.svelte spreads `...rest` on the `<img>` of the `img` delivery. The conformance test against createIcon failed on extra attributes.

## Insight
Svelte 5's server compiler adds `onload="this.__e=event" onerror="this.__e=event"` to any `<img>` (load/error element) with spread attributes, to replay those events at hydration (`compiler/phases/3-transform/server/visitors/shared/element.js`). They are inline handlers: a strict CSP `script-src` without `'unsafe-inline'` blocks them and reports a violation, but the image still loads.

## Application
Keep the spread (attribute passthrough matters). Strip only those two attributes in the Svelte conformance comparison, and document the CSP note in the Svelte docs. Re-check if Svelte changes this behavior.
