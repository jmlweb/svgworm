---
title: Icon component reference
navTitle: Icon component
description: "Every prop of the React Icon and the generated Icon.astro, the markup each icon delivery renders (svg, img or a CSS mask), and how to size and color icons with CSS."
order: 4
---

`Icon` is the one component svgworm gives you: `createIcon(manifest)` from `@svgworm/react`, or the `Icon.astro` that `svgworm init` writes. Both read the manifest and render the same markup with **no client JavaScript**. A test in this repository keeps them in step ([ADR-0017](https://github.com/jmlweb/svgworm/blob/main/docs/adr/0017-astro-support-via-generated-icon-astro.md)). This page covers both.

```tsx
<Icon name="home" />
<Icon name="home" title="Go home" />
<Icon name="brand/sunset" width={32} height={32} className="logo" />
```

## Props

| Prop                                 | Type                                                               | Default  | Meaning                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `name`                               | `IconName`                                                         | required | An icon from the manifest. The type is the union of every name, so a typo is a compile error (`tsc` or `astro check`)            |
| `title`                              | `string`                                                           |          | Accessible name. Renders a `<title>` inside the `<svg>` (or `alt` / `aria-label` for the other deliveries) and sets `role="img"` |
| `label`                              | `string`                                                           |          | Accessible name as `aria-label`, with `role="img"`. Use `title` or `label`, not both; `title` wins                               |
| `width`, `height`                    | `number \| string`                                                 | `1em`    | Size. A bare number is pixels. `1em` follows the font size of the parent, so an icon next to text scales with it                 |
| `className` (React), `class` (Astro) | `string`                                                           |          | Passed to the rendered element, whatever it is                                                                                   |
| `style`                              | React: object. Astro: string or object                             |          | Passed to the rendered element. On a mask icon it is merged after the mask declarations, so it can override them                 |
| any other SVG prop                   | `SVGProps<SVGSVGElement>` minus `children`, `ref`, `title`, `name` |          | `id`, `data-*`, `aria-*`, `onClick` and so on. On the `img` and `mask` deliveries only HTML attributes carry over                |

Without `title` or `label` the icon is **decorative**: `aria-hidden="true"` on the `<svg>` and the `<span>`, `alt=""` on the `<img>`. The `<svg>` also gets `focusable="false"` so old Edge does not tab into it.

## Markup per delivery

The manifest records a `delivery` per icon ([how svgworm works](/docs/how-it-works/#delivery)). `Icon` renders a different element for each. **CSS that targets `svg` reaches only the first one.**

### `use` (most icons)

```html
<svg
  focusable="false"
  height="1em"
  viewBox="0 0 24 24"
  width="1em"
  aria-hidden="true"
>
  <use href="/icons/icons.d907d82b.svg#i-home"></use>
</svg>
```

With `title="Go home"`: `role="img"`, no `aria-hidden`, and `<title>Go home</title>` before the `<use>`.

The icon's paths live in the sprite's `<symbol>`. Mono icons are drawn with `currentColor`, so the `color` of the `<svg>` (inherited from the parent) is the icon color.

### `img` (multicolor icons that need gradients, masks, clip paths or filters)

```html
<img
  alt=""
  height="1em"
  src="/icons/icons.stack.91bff0b3.svg#i-brand--sunset"
  width="1em"
/>
```

The stack file shows the one nested `<svg>` whose id is the URL fragment. An `<img>` cannot inherit `currentColor`, which is fine, because these icons keep their own colors. `title` or `label` becomes the `alt`.

### `mask` (mono icons that need gradients, masks, clip paths or filters)

```html
<span
  aria-hidden="true"
  style='display:inline-block;width:1em;height:1em;background-color:currentColor;mask:url("/icons/icons.stack.91bff0b3.svg#i-caf_e9_") center / contain no-repeat'
></span>
```

The icon is a CSS mask over a `currentColor` background, so it follows the parent's `color` like a `use` icon. Its size is an inline style. **Change it with the `width` and `height` props** (or `style`), not with a class.

## Sizing

- The default `1em` makes every delivery follow the parent's `font-size`: a 20 px line gets 20 px icons.
- `width` and `height` props set the size on every delivery: `width={24} height={24}` or `width="1.5rem" height="1.5rem"`.
- A CSS rule on a class (`.icon { width: 2rem; height: 2rem }`) resizes `svg` and `img` icons, but not `mask` icons, whose size is inline. **Use the props when the icon may be a mask icon.**

## Coloring

- **Mono icons:** set `color` on the parent (or on the icon through `className`/`class`). Mono icons follow it, on both the `use` and the `mask` delivery. A link that turns red on hover turns its icon red too.
- **Multicolor icons:** they ignore `color` and keep the colors from the SVG file. To make one follow `currentColor`, add a `mono` [color override](/docs/config/#color-overrides). svgworm fails the build when the icon has content that cannot follow it.
- **Do not set `fill` or `stroke`** on the `<svg>`. The symbol's own attributes win inside a `<use>`. `color` is the only knob.

## Reaching every delivery with CSS

Give the icon a class and target that, never the element name:

```css
.icon {
  vertical-align: -0.125em; /* sits on the text baseline */
  flex: none;
}
```

```tsx
<Icon name="home" className="icon" />
```

In Astro the prop is `class`. Both components put the class on the element they render, whichever it is.

## Errors

- **Unknown name:** a `name` that is not in the manifest is a type error. At runtime (an untyped name, or a stale manifest) the component throws `Unknown icon "…"`, with the closest names in React.
- **`Unsupported svgworm manifest version`:** the manifest was written by a newer svgworm than the adapter reads. Update `@svgworm/react`, or re-run `svgworm init` for a fresh `Icon.astro`.
- **`Icon "…" needs the stack file …, but the manifest has none`:** the manifest is from an older build. Run `svgworm` again.

See [Troubleshooting](/docs/troubleshooting/) for icons that render blank or in the wrong color.
