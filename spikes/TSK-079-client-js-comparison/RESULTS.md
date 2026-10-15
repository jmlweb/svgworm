# TSK-079: client JS, svgworm vs lucide-react vs SVGR

Reproduce (needs the repo built once, `pnpm build` at the root; Playwright Chromium cached):

```sh
cd spikes/TSK-079-client-js-comparison
pnpm install --ignore-workspace
pnpm measure          # node src/measure.mjs: builds, serves, measures, writes results/
```

Output: `results/results.json` (all numbers, per-route script URLs) and `results/table.md`.

## Method

One Next.js 16 App Router app with seven routes, built with `next build` (Turbopack, production, all routes static). The same 20 Lucide icons (`house search settings user bell mail heart star trash-2 plus x check chevron-right menu calendar camera download upload lock globe`) are rendered three ways. One app, not three: all variants share the exact same framework build, layout and chunk floor, so a `/baseline` route (no icons) gives a subtractable framework cost.

| Route | Variant | Icons rendered in |
| --- | --- | --- |
| `/baseline` | none | no icons |
| `/svgworm`, `/svgworm-client` | svgworm CLI output + `@svgworm/react` `createIcon` | Server Component page / one `'use client'` component |
| `/lucide`, `/lucide-client` | `lucide-react` named imports | same |
| `/svgr`, `/svgr-client` | `@svgr/webpack` over the same `lucide-static` SVG files | same |

The `*-client` routes render the icons inside a small `'use client'` component (a `useState` counter button plus the 20 icons): the realistic interactive case. The server routes have no `'use client'` anywhere in the page.

`src/measure.mjs`:

1. copies the 20 SVGs from `lucide-static` to `icons/`, runs the local `svgworm` CLI (sprite, manifest, types), runs `next build`;
2. starts `next start` and loads each route in Playwright Chromium, a fresh browser context per route (cold cache), waiting for `networkidle`;
3. for each response records type, decoded body bytes (raw) and gzip level 9 size. "Client JS" is the sum of all `script` responses the page loads (framework runtime included); "HTML" is the document response; "sprite" is every `.svg` file requested;
4. subtracts `/baseline` to show the cost over the framework floor.

SVGR runs under Turbopack through `turbopack.rules` in `next.config.ts` (`@svgr/webpack` as a loader, `as: '*.js'`, option `icon: true`), so no `--webpack` fallback was needed.

## Versions

| Tool | Version | Published |
| --- | --- | --- |
| next | 16.3.8 (Turbopack) | 2026-09-30 |
| react / react-dom | 19.3.0 | 2026-09-09 |
| lucide-react | 1.50.0 | 2026-10-02 |
| lucide-static | 1.50.0 | 2026-10-02 |
| @svgr/webpack | 8.1.0 | 2023-08-15 (latest) |
| svgworm / @svgworm/react | local build of this commit (0.2.1 + unreleased) via `file:` | n/a |
| playwright | 1.58.2, Chromium 145.0.7632.6 | n/a |
| Node / OS | v24.13.0, darwin-arm64 | n/a |

The versions are at least two weeks old on 2026-10-15, except that `next` 16.3.8 is 15 days old and lucide 1.50.0 is 13 days old. lucide-react and lucide-static are pinned to the same version so the SVG files and the components match.

## Numbers

Single run on one machine, sizes in KiB (1024 bytes); exact bytes are in `results/results.json`.

| Variant | Icons in | Client JS raw | Client JS gzip | JS over baseline raw / gzip | HTML raw / gzip | Requests (total / script / sprite) |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| baseline | no icons | 442.9 | 130.1 | 0.0 / 0.0 | 4.6 / 1.5 | 6 / 5 / 0 |
| svgworm | server | 442.9 | 130.1 | 0.0 / 0.0 | 13.5 / 2.0 | 7 / 5 / 1 |
| svgworm | client | 447.0 | 131.6 | 4.2 / 1.5 | 8.0 / 1.8 | 8 / 6 / 1 |
| lucide-react | server | 445.3 | 131.3 | 2.5 / 1.2 | 20.0 / 3.7 | 7 / 6 / 0 |
| lucide-react | client | 450.6 | 133.4 | 7.7 / 3.3 | 12.6 / 2.8 | 7 / 6 / 0 |
| SVGR | server | 442.9 | 130.1 | 0.0 / 0.0 | 22.4 / 3.5 | 6 / 5 / 0 |
| SVGR | client | 453.2 | 132.2 | 10.3 / 2.1 | 12.4 / 2.9 | 7 / 6 / 0 |

The sprite is 5.3 KiB raw / 1.2 KiB gzip (one extra request, long-cacheable because the file name is content-hashed; the other variants have none).

What the numbers say:

- **Server pages.** svgworm and SVGR add zero client JS (identical script set to the baseline). `lucide-react` 1.50.0 still adds one 2.5 KiB (1.2 KiB gzip) chunk to a page with no `'use client'`: its `Icon` component and context are marked `'use client'` upstream (`dist/esm/Icon.mjs`, `context.mjs`), so even server-rendered Lucide icons hydrate.
- **Client component.** Icon code enters the bundle for every variant: svgworm +4.2 KiB raw (the manifest of the 20 icons plus the `createIcon` component, no path data), lucide-react +7.7 KiB, SVGR +10.3 KiB (the path data of 20 icons as components).
- **Total icon cost over baseline, gzip, including HTML and sprite (rough sums of the table):** server page: svgworm about 1.7 KiB (0.6 HTML + 1.2 sprite), SVGR about 2.0 KiB, lucide-react about 3.4 KiB. Client component: svgworm about 3.0 KiB, SVGR about 3.5 KiB, lucide-react about 4.6 KiB.
- **Requests.** svgworm costs one extra request for the sprite; the other variants have none. Script request counts differ by at most one lazily split chunk.

## Limits (read before quoting)

- **Twenty icons is small.** The framework floor (443 KiB raw, 130 KiB gzip) dwarfs every difference here. In absolute terms the gaps are 1 to 3 KiB gzip. They grow with the number of icons rendered in client components, and shrink toward nothing if icons are mostly in Server Components and you use SVGR or inline markup.
- **On a server page, SVGR is about as light as svgworm.** SVGR inlines the markup in the HTML and in the RSC payload (22.4 KiB raw HTML vs 13.5 KiB for svgworm), but with gzip the gap is small, and it needs no extra request. svgworm wins mostly in client components, and on repeat views where the cached sprite is reused while inline SVG is re-sent with every page.
- **lucide-react tree-shakes per icon.** The measured cost is for 20 named imports. The gap depends on the client-component share: if the icons only appear in Server Components the lucide penalty is the single 2.5 KiB chunk above. This is specific to lucide-react 1.50.0; a later release may drop `'use client'` and reach the SVGR/svgworm level.
- **svgworm needs an extra build step** (the CLI, run before `next build`) and a generated manifest module, which SVGR and lucide-react do not. It is 0.x and its output contract may still change. Icons you do not own as files (a public set) are easier with lucide-react directly; here lucide-static supplies the SVG files only to make the three variants identical.
- **SVGR options matter.** SVGR 8.1.0 with `icon: true` and its default SVGO pass. Other options (no SVGO, `memo`, `ref`) change its sizes. The loader is old (last release 2023) but works under Turbopack's loader support.
- **Not measured:** runtime cost (hydration time, memory), a warm-cache second visit (the numbers use a cold cache), `next dev`, Firefox and WebKit (the sprite behavior there is covered by TSK-002 and TSK-004), and other bundlers. One machine, one run. Byte counts come from a localhost server; Next compresses responses on the wire, so the gzip columns (level 9 of the decoded body) approximate transfer size and are not the exact wire bytes.
- The client component is deliberately small and identical in shape across variants. A real component adds its own code to the same chunk; the icon deltas stay valid, the totals do not.
