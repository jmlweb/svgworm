# Upstream issues for @neodx/svg

**Posted 2026-10-12:** [#186](https://github.com/secundant/neodx/issues/186) (Turbopack), [#187](https://github.com/secundant/neodx/issues/187) (SSR inject blanks, mask recolor), [#188](https://github.com/secundant/neodx/issues/188) (NFC/NFD ids). The drafts below are kept as the record of what was reported.

Principle "be fair to competitors" ([traction.md](../traction.md)): report what the [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md) found before publishing the comparison, and link the issues from [comparison.md](../comparison.md) once they exist. Tracker: <https://github.com/secundant/neodx/issues>. On 2026-10-12 no open or closed issue there mentions Turbopack, SSR injection, or Unicode normalization (`gh search issues --repo secundant/neodx turbopack`, `"ssr OR inject"`, `"NFD OR normalize"` all return nothing), so these would not be duplicates.

Tested version: `@neodx/svg` 1.1.1 (latest on npm, published 2026-08-25) in Next.js 16.4.0 with Turbopack, React 19.3.0, Node 24.13. Repro: `spikes/TSK-007-neodx-next` in this repo (`pnpm install && pnpm build`). Before posting, re-run it against the current neodx release, and paste the exact commit of the spike folder in each issue.

Tone: specific, reproducible, no comparison with svgworm in the issue body. Mention svgworm only if asked.

---

## Issue 1: documented Next.js setup fails under Turbopack (Next 16 default)

**Title:** `@neodx/svg/webpack` in `next.config` fails on Next 16, where Turbopack is the default bundler

**Body:**

The Next.js guide configures `@neodx/svg/webpack` through `next.config`. Next 16 uses Turbopack for `next dev` and `next build` by default, and the build stops with:

```
This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

It only works with `next build --webpack`, which the docs do not mention.

Repro: Next 16.4.0, `@neodx/svg` 1.1.1, `next.config.ts` with the documented `svg()` plugin, `next build`. Minimal project: `<link to spike folder at commit>`.

What worked for me: calling `createSvgSpriteBuilder` from the Node API in a `prebuild`/`predev` script (about 12 lines). Suggestions:

1. Document the Node API script as the Next.js path, or mark the webpack plugin as "webpack only" with the `--webpack` flag.
2. Longer term, a Turbopack-compatible integration (there is no unplugin hook for Turbopack today).

---

## Issue 2: `inject` assets render nothing in Server Components (SSR), but are marked done

**Title:** `inline: 'auto'` assets are blank in SSR: `mountSvgSprite` returns early without `window` yet marks the asset as mounted

**Body:**

With the default `inline: 'auto'`, icons with gradients or masks go into an `inject` asset. In a React Server Component (Next 16 App Router) they render as empty boxes. `mountSvgSprite` returns early when `window` is undefined but still flags the asset as `done`, so nothing is ever injected on the server and the client does not retry.

Repro: `spikes/TSK-007-neodx-next`, `icons/general/gradient.svg` and `mask.svg`, rendered with the hook-free component from the docs in `app/page.tsx`. Screenshot before/after available.

Workaround I used (20 lines, needs a type cast): read `asset.meta.content` of the `inject` assets from `sprites.all` and render it with `dangerouslySetInnerHTML` in the root layout. See `app/_ui/inline-sprites.tsx` in the repro.

Suggestions:

1. Export a server-safe helper that returns the inject markup as a string (or a component), so SSR frameworks can render it.
2. Do not mark the asset `done` when `window` is undefined.

Related, smaller: with `resetColors` defaults the mask's `fill="#fff"` becomes `currentColor`, so mask luminance (and the icon's shape) follows the text color. Masks and clipPaths should probably be excluded from color resets. I can open that separately if you prefer.

---

## Issue 3: file names are not Unicode-normalized, so NFC and NFD `café.svg` produce different ids and hashes

**Title:** Icon ids and sprite hashes depend on the Unicode normalization form of the file name

**Body:**

`icons/café.svg` saved with NFC bytes gives id `café`; the same file name in NFD (as macOS Finder or some git checkouts produce it) gives a visually identical but different id, a different sprite hash, and a generated type that does not match a typed `"café"` in code. The output of the same repo then differs between a macOS and a Linux checkout.

Repro: `spikes/TSK-007-neodx-next`, rename `icons/general/café.svg` to its NFD form (`node -e "require('fs').renameSync('icons/general/café.svg', 'icons/general/' + 'café'.normalize('NFD') + '.svg')"`), rebuild, diff `app/sprite.gen.ts` and the sprite file name.

Suggestion: normalize path segments to NFC before deriving names and ids, and document it. Lowercasing with `toLowerCase()` (not the locale variant) would also keep ids stable across machines.

---

## After posting

- Add the three issue URLs to the @neodx/svg table in [comparison.md](../comparison.md).
- Log the date in TSK-029 and close it.
- If a maintainer fixes any of them, update the comparison row: it must describe the current release, not the one we tested.
