---
id: RPT-019
title: img-delivery icons render at 1x1 px by default because width="1em" is not a valid img dimension
type: bug
severity: high
status: triaged
created: 2026-11-24
triaged: 2026-11-24
task-id: TSK-113
---

## What happens

Icons with `delivery: "img"` (multicolor icons that need gradients, masks, clip paths or filters) render at **1 x 1 CSS px** when no `width`/`height` prop is given, so they are effectively invisible.

The React adapter defaults the size to `'1em'` (`packages/react/src/create-icon.tsx:71`, `DEFAULT_SIZE = '1em'`) and passes it as the HTML attributes of the `<img>` (`packages/react/src/create-icon.tsx:164-171`). On `<svg>` the attribute is a CSS length, so `1em` works. On `<img>`, `width`/`height` are HTML dimension attributes: the HTML "rules for parsing dimension values" read the leading digits and stop at `e`, so `width="1em"` means 1 px.

The generated `Icon.astro`, `Icon.vue` and `Icon.svelte` templates render the same markup (`packages/svgworm/src/cli/init/plan.ts:968-969` and `:1054`, `:1254-1255` and `:1315`, and the site copy `apps/site/src/components/Icon.astro:51-52` and `:137`), so every adapter has the bug. The documented markup in `apps/site/src/content/docs/icon.md:57-62` shows the same `height="1em"` / `width="1em"`.

## Reproduction

Observed on 2026-11-24 with the repo's Playwright browsers:

```js
const html = `<div style="font-size:32px"><img id="a" alt="" width="1em" height="1em" src="data:image/svg+xml,…24x24 red rect…"></div>`;
// getBoundingClientRect() of #a
```

Output:

```
chromium 1x1
firefox 1x1
```

(WebKit could not start on this host because of missing system libraries.) The expected size is 32 x 32, as the `<svg>` and `mask` deliveries give at `font-size: 32px`.

The unit test `packages/react/src/create-icon.test.tsx:87` asserts the markup string `<img alt="" height="1em" … width="1em"/>`, and the render matrix (`pnpm render:check`) renders the delivery forms with its own markup, so no check exercises the adapter's default size in a browser.

## Suggested fix

Give the `<img>` its default size through CSS instead of the dimension attributes, for example `style={{ width, height, ...style }}` (or keep numeric `width`/`height` props as attributes and move string lengths into the style), in `createIcon` and in all three templates, which the conformance tests keep in sync. Add a browser check that renders a default-size `img` icon from the adapter output and expects it to be 1em square.
