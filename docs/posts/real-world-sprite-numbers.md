# I ran svgworm on the icon folders of Supabase, cal.com and Refine (draft)

> Draft for LinkedIn and X (TSK-030, replaces the migration-PR track for famous repos). Numbers come from `scripts/bench-repo.mjs`, a read-only run against public repos: nothing is sent to them and no PR is opened. Before publishing: (1) browser-check the rendering of each folder (see "Before publishing"), (2) re-run the script and update the commits and numbers, (3) record the publish date in TSK-030 and `docs/metrics/manual.json`. Publish the numbers and the script, never the SVG files: many are third-party logos.

## Long version

Icon folders in big open-source projects are rarely a problem anyone is fighting. They are a folder of `.svg` files in `public/`, loaded one by one. I wanted to know what a sprite changes on real, unmodified folders, so I pointed svgworm at them.

Same files, three states: the originals, svgo alone (multipass), and the svgworm sprite. "Gzip" below sums each file compressed on its own, which is what the browser downloads when every icon is its own request.

| Folder | Icons | Originals (gzip) | svgo only (gzip) | svgworm sprite (gzip) |
|---|---|---|---|---|
| supabase/supabase `apps/docs/public/img/icons` | 259 | 217,224 B in 259 requests | 157,139 B | 81,745 B in 1 request |
| supabase/supabase `apps/studio/public/img/icons` | 127 | 129,932 B in 127 requests | 98,358 B | 52,360 B in 1 request |
| calcom/cal.com `apps/web/public/country-flag-icons` | 255 | 111,717 B in 255 requests | 83,008 B | 45,990 B in 1 request |
| refinedev/refine `packages/live-previews/public/assets/icons` | 137 | 40,016 B in 137 requests | 39,202 B | 16,649 B in 1 request |

The sprite is 58 to 62% smaller than the originals when gzipped, and 45 to 58% smaller than svgo alone. Brotli gives the same picture (59 to 64% vs the originals).

What the numbers do **not** say: a page shows a handful of icons, not 259. The sprite is a single cached file that holds all of them, so the first page view can download more icon bytes than it needs. What it buys is one request instead of hundreds, a file that is cached for a year because its name carries a content hash, and icon names that are checked at compile time. Treat the size table as "how heavy is the whole set", not "what you save per page".

Two details I like:

- **It decides color per icon.** Supabase docs came out as 204 mono and 55 multicolor, studio as 43 and 84, the cal.com flags as 255 multicolor, Refine as 137 mono. Mono icons follow `color`, multicolor ones keep their colors. Nobody wrote a config for it.
- **It fails loudly.** svgworm rejected 4 files out of 782: one with a raw `<style>` and an `@media` rule (it would leak into every other icon in a sprite), one that is not valid UTF-8, one with a `<script>`, and one flag with a `:hover` rule. Silent output would have shipped those. I excluded them from the totals and listed them.

Reproduce it:

```bash
pnpm build
node scripts/bench-repo.mjs --repo supabase/supabase --path apps/studio/public/img/icons
```

It shallow-clones the repo, builds, measures, and deletes everything.

## Short version (X / LinkedIn post)

I pointed svgworm at the icon folders of Supabase, cal.com and Refine. Unmodified files, read-only.

- Supabase docs: 259 icons, 259 requests, 217 KB gzip, down to 1 request and 82 KB (-62%)
- Supabase studio: 127 icons, 130 KB down to 52 KB (-60%)
- cal.com flags: 255 flags, 112 KB down to 46 KB (-59%)

It sorted mono from multicolor icons per icon, with no config, and rejected 4 files that would have leaked styles into the sprite.

Caveat: one sprite holds the whole set, so per-page bytes depend on the page. The win is 1 cached request, content-hashed, with typed names.

Script and method: svgworm.com

## Before publishing

- **Rendering check.** Done on 2026-10-16 with `node scripts/render-check.mjs --fixtures <folder> --out <dir>` against the commits above. It found RPT-006: icons with a viewBox origin other than `0 0` were shifted through `<use>`. That is fixed in TSK-094 (ADR-0030). Publish only after that release, and re-run the check: with the fix, Supabase and Refine match in all three engines, and cal.com differs only on 6 flags that draw outside their own viewBox, where the sprite clips.
- **Re-run** `scripts/bench-repo.mjs` on the day: repos move, and the commit hash must match what the post says.
- **Tone.** These are healthy projects. The post is about what a sprite changes, not about what they did wrong. Do not tag maintainers to ask for anything.
- **Licenses.** Show numbers and the script only. The Supabase repo is Apache-2.0 but brand logos inside it are not ours to republish.
