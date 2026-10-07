# TSK-007 spike: @neodx/svg in Next.js App Router with Turbopack

_Date: 2026-10-08. Throwaway prototype, evidence only._

Setup: Next.js 16.4.0 (Turbopack is the default for `dev` and `build`), React 19.3.0, `@neodx/svg` 1.1.1, Node 24.13, macOS, headless Chrome for rendering.
Fixtures: self-authored icons in `icons/` (mono fill, stroke, multicolor, gradient, mask, non-ASCII name, multicolor logo), two folders.

## Results

| Check                                                            | Result                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documented Next.js setup (`@neodx/svg/webpack` in `next.config`) | **Fails.** `next build` errors: "This build is using Turbopack, with a `webpack` config and no `turbopack` config." Works only with `next build --webpack`                                                                                                          |
| CLI (`sprite`)                                                   | **Deprecated** (warns on run). Has no `fileName`/hash option. Ignored `--root` for input and picked up `public/*.svg`                                                                                                                                               |
| Node API as `prebuild`/`predev` script                           | **Works** with Turbopack. 12-line script. No watch in dev (not tested further)                                                                                                                                                                                      |
| Runtime dependency on `@neodx/svg`                               | **None.** Runtime helpers are inlined into the generated `sprite.gen.ts` (~300 lines)                                                                                                                                                                               |
| Server Components                                                | **Works.** Both the docs' component (`forwardRef` + `useMemo`) and a hook-free one render on the server. 0 client chunks reference the sprite module                                                                                                                |
| Types                                                            | **Works.** `'general:nope'` is a type error                                                                                                                                                                                                                         |
| Hashed URLs                                                      | **Works.** `href="/sprites/general.b2dca8dd.svg#stroke"`                                                                                                                                                                                                            |
| Stroke icons                                                     | **Correct.** `stroke` becomes `currentColor`, `fill="none"` kept                                                                                                                                                                                                    |
| Mono fill icons                                                  | **Partial.** svgo strips `fill="#000"` as a default, so the icon renders black, not `currentColor`, unless the component or CSS sets `fill`                                                                                                                         |
| Multicolor icons (default config)                                | **Silently flattened** to one `currentColor`. The two-rect logo was even merged into one path                                                                                                                                                                       |
| Gradient / mask icons                                            | **Blank in SSR.** `inline: 'auto'` moves them to an `inject` asset whose `mountSvgSprite` returns early when `window` is undefined, yet marks the asset `done`. Rendering the inject markup manually in the layout fixes it (20-line workaround, needs a type cast) |
| Mask contents                                                    | **Altered.** The mask's `fill="#fff"` was rewritten to `currentColor`, so mask opacity now depends on text color                                                                                                                                                    |
| Determinism: rerun, other absolute path, reversed copy order     | **Identical** (weak test: APFS lists directories sorted)                                                                                                                                                                                                            |
| Determinism: NFC vs NFD file name (`café.svg`)                   | **Differs.** NFD gives a different id (`café`), different sprite hash, and a type that doesn't match a typed `"café"`                                                                                                                                               |

Screenshots: before and after the inject workaround, in the session scratchpad (not committed).

## Verdict for positioning

With Turbopack, @neodx/svg works only through its Node API plus hand-written glue. The documented Next.js path breaks on the default bundler, and the CLI is deprecated. Zero client JS and Server Component support are achievable.

Out-of-the-box correctness is where it falls short. Default settings silently flatten multicolor icons, blank out gradient and mask icons during SSR, alter masks, and drop mono fills to black. File names aren't Unicode-normalized.

The opening for svgworm stands: correct per-icon output with zero config, that works in Next.js with Turbopack and Server Components. The opening is not "sprites + types + hashing"; those are table stakes.
