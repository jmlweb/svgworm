# Launch plan for v0.1.0 (draft)

TSK-019. `svgworm@0.1.0` has been on npm since 2026-10-13 ([release.md](../release.md)), so everything here can start. The pre-launch post ([posts/per-icon-color.md](../posts/per-icon-color.md), TSK-028) goes out first, so launch day links to it instead of explaining the color result again.

## Launch post

Working title: **"Icons in Next.js App Router with zero client JS, and colors that stay right"**

Structure (each claim links to its spike or the example):

1. The symptom: SVGR turns every icon into JavaScript; sprite plugins break under Turbopack or flatten colors. One paragraph, no adjectives.
2. What svgworm does in 5 commands: install, `svgworm init --yes`, `svgworm`, `<Icon name="…" />`, `svgworm check` in CI. Copy from the README quick start.
3. The two results: per-icon color (31k icons, 99.98%, zero recolored; link the pre-launch post) and gradients/masks that render in Chromium, Firefox and WebKit through the stack file ([TSK-002](../../spikes/TSK-002-external-use/RESULTS.md), [TSK-004](../../spikes/TSK-004-sprite-url/RESULTS.md)).
4. The Turbopack comparison with @neodx/svg, pointing at the upstream issues we opened ([neodx-issues.md](neodx-issues.md)) and at the [comparison page](https://svgworm.com/docs/comparison/), including where neodx or SVGR is the better pick.
5. Zero client JS, proven: the example's chunk check ([examples/next-app-router](../../examples/next-app-router)).
6. What it does not do (several sprites, inline sprite, frameworks other than React and Astro) and the kill criteria, in the open: we review adoption on 2027-01-05, 12 weeks after publish.

## Submissions (launch week)

| Channel | Form | Note |
|---------|------|------|
| r/nextjs, r/reactjs | Text post (see the launch kit below), not a bare link | Disclose authorship. Answer every comment within 24 h |
| This Week in React | Submit via the newsletter form | Short blurb plus the color number |
| React Status | Submit link on or after 2026-10-23 (on a break until then) | Same blurb; Cooperpress, so at most one pick between it and JavaScript Weekly (TSK-053) |
| Bytes, JavaScript Weekly | Submit link | Same blurb |
| Bluesky, X | The 5-tweet thread from the pre-launch post, updated with the npm link | One before/after image |
| Hacker News "Show HN" | Only if the post stands on its numbers; title names the measurement, not the tool | Be around for 3 hours after posting |
| GitHub Discussions (vercel/next.js), Stack Overflow | Answer existing questions about SVG sprites in App Router or icons in Server Components | Answer first, mention svgworm only where it fits |

## What the first posts taught us (2026-10-16)

The per-icon color post went out on 2026-10-15 as a LinkedIn article, a LinkedIn post and an X thread. Result after one day: 2 likes on LinkedIn, 1 on X, 0 GitHub stars, no GitHub traffic referrers, 1 unique repo viewer in 14 days. The content was not tested; the channel was. A small personal following cannot carry a launch, which [traction.md](../traction.md) already assumed.

So the next round goes where the target user already gathers or already has the problem, and nothing depends on the maintainer's follower count:

1. **Answers to existing questions** (SVGR under Turbopack, sprites in App Router, icons in Server Components). Each one helps someone with the symptom today, and it stays findable. Candidates and draft answers: [answers.md](answers.md).
2. **The real-world numbers post** ([posts/real-world-sprite-numbers.md](../posts/real-world-sprite-numbers.md)) as a Reddit text post. Named projects and a reproducible script are a stronger hook than a technique post.
3. **Show HN** with the CLI, a few days after Reddit, once the first questions have been answered.
4. **This Week in React** with the Reddit post or the docs link, then React Status and JavaScript Weekly (TSK-053).
5. **One starter PR or issue** (Enterwell/react-starter, TSK-030), because adoption by a starter is a kill criterion.

Every link in these posts points at `https://github.com/jmlweb/svgworm` or at svgworm.com. GitHub referrers are the only free attribution we have, so prefer the repo link where both fit.

## Launch kit (paste-ready)

**Hold the Reddit and Show HN posts until the fix for RPT-006 is released** (TSK-094, [ADR-0030](../adr/0030-consumer-viewbox-keeps-only-the-size.md); the changeset is in `.changeset/viewbox-origin-use.md`). Before the fix, icons whose `viewBox` did not start at `0 0` rendered shifted through the sprite in every engine, and the post invites people to try it on their own folders. After the release, re-run the check on the four folders (`node scripts/render-check.mjs --fixtures <folder> --out <dir>`). On 2026-10-16, with the fix: Supabase docs 466/466, Supabase studio 217/217, Refine 274/274, and cal.com 498/510. The 6 cal.com flags left draw outside their own viewBox: the symbol clips to the viewBox, while the original `<img>` in a square box shows the overflow in the letterbox. Then add this line to the Reddit body: "Every icon was rendered in Chromium, Firefox and WebKit from the sprite and compared with the original file; the only differences are 6 cal.com flags whose drawing spills past their own viewBox, which the sprite clips."

Disclose authorship in every post. Read each subreddit's sidebar rules on the day: self-promotion rules change, and a removed post burns the link. Post on a Tuesday to Thursday morning US Eastern time and stay around for the first three hours.

### r/nextjs (text post, flair "Discussion" or "Show")

Title:

> I measured what one SVG sprite does to the icon folders of Supabase, cal.com and Refine

Body:

> I maintain svgworm, a CLI that compiles a folder of SVGs into one content-hashed sprite plus a typed `Icon` that works as a Server Component with zero client JS. Before asking anyone to use it, I wanted numbers on real folders, so I ran it read-only against four public ones.
>
> | Folder | Icons | Originals, gzip | svgworm sprite, gzip |
> |---|---|---|---|
> | Supabase docs icons | 259 | 217 KB in 259 requests | 82 KB in 1 request |
> | Supabase studio icons | 127 | 130 KB in 127 requests | 52 KB in 1 request |
> | cal.com country flags | 255 | 112 KB in 255 requests | 46 KB in 1 request |
> | Refine icons | 137 | 40 KB in 137 requests | 17 KB in 1 request |
>
> The caveat that matters: a page shows a few icons, not 259, so the per-page saving depends on the page. What the sprite buys is one request, cached for a year because the file name is a content hash, and icon names that fail `tsc` when you mistype them.
>
> Two things I did not expect:
>
> - It sorted mono from multicolor per icon with no config (Supabase studio: 43 mono, 84 multicolor; the cal.com flags: all multicolor). Mono icons follow `color`, logos keep their colors.
> - It rejected 4 of 782 files, each with a reason: a `<script>`, a file that is not valid UTF-8, and two `<style>` blocks (`@media`, `:hover`) that would leak into every other icon in a sprite.
>
> Script to reproduce (it shallow-clones, measures, deletes): `node scripts/bench-repo.mjs --repo supabase/supabase --path apps/studio/public/img/icons` in https://github.com/jmlweb/svgworm
>
> Where it is the wrong tool: if you use a public icon set like lucide, its React package is already fine. If you need icons inlined in the HTML, svgworm does not do that. The [comparison page](https://svgworm.com/docs/comparison/) lists when SVGR or @neodx/svg is the better pick.
>
> Happy to run it on your icon folder if you post the repo and path.

The last line is the point of the post: every "try mine" reply is a conversation with a user who has the problem.

### r/reactjs

Check the rules first: if project posts are routed to a weekly thread, post there. Use the same body with the first line changed to "React Server Components" instead of Next.js, and add the Vite path (`pnpm example:vite:check` shows a Vite + React app referencing the hashed sprite).

### Show HN

Title (no adjectives, under 80 characters):

> Show HN: svgworm – compile a folder of SVGs into a typed sprite, zero client JS

URL: `https://github.com/jmlweb/svgworm`

First comment, posted right after:

> I built this because every way I found to ship custom SVG icons in a React Server Components app either turned each icon into JavaScript (SVGR) or needed a bundler plugin that broke under Turbopack. svgworm is a CLI instead: it writes a content-hashed sprite, a manifest and TypeScript types, and the `Icon` component just renders `<svg><use href="/icons/icons.<hash>.svg#i-home"/></svg>`.
>
> The two parts that took the most work:
>
> 1. Color per icon. A sprite tool has to decide whether to replace an icon's fills with `currentColor`. Doing it globally breaks logos; never doing it breaks dark mode. I wrote a static classifier and checked it against rendering on 31,390 icons: 99.98% agreement, and zero multicolor icons wrongly recolored. Write-up: https://github.com/jmlweb/svgworm/blob/main/docs/posts/per-icon-color.md
> 2. WebKit does not resolve gradients, masks, clip paths or filters inside an external `<use>`. Icons that need them are emitted to an SVG stack file and rendered through `<img>` or a CSS mask, decided per icon. A Playwright matrix renders every fixture in Chromium, Firefox and WebKit in CI.
>
> On real folders (Supabase, cal.com, Refine) the sprite is 58 to 62% smaller gzipped than the original files, in 1 request instead of hundreds; the script that measures it is in the repo.
>
> It is 0.x, MIT, with Next.js, Vite and Astro paths. It is not useful if you only use a public icon set with its own React package. I review adoption on 2027-01-05 and will stop if nobody uses it, so honest feedback is the most useful thing you can give me.

### This Week in React (and React Status, JavaScript Weekly)

> svgworm: a CLI that turns a folder of SVGs into a content-hashed sprite plus a typed `Icon` Server Component with zero client JS. It decides mono vs multicolor per icon (0 multicolor icons recolored across 31,390 tested) and works with Turbopack without a plugin. On Supabase's and cal.com's icon folders the sprite is about 60% smaller gzipped, in 1 request.

Link: the Reddit post if it got traction, otherwise `https://svgworm.com/docs/nextjs/`. Never resubmit the same link to the same newsletter.

### X and Bluesky

Broadcasting to a small following does not reach anyone. Use replies instead: search for "svgr turbopack", "svg sprite next.js" and "icons server components" and answer people who have the problem, with the docs link only when it solves it. Post the numbers table as an image once the Reddit post is up and quote it.

## Starters and templates to propose svgworm to

Adoption by one public starter or template is a kill criterion ([ADR-0005](../adr/0005-build-standalone-with-kill-criteria.md)). Shortlist, with the angle for each. Verify maintainers accept dependency proposals before opening a PR; an issue first is often better.

| Starter | Why it fits | Angle |
|---------|-------------|-------|
| [Enterwell/react-starter](https://github.com/Enterwell/react-starter) | App Router, custom icons, active (target list #13) | Direct PR replacing SVGR |
| [PxlSyl/tailwind-nextjs-starter-blog-i18n](https://github.com/PxlSyl/tailwind-nextjs-starter-blog-i18n) | Popular blog starter with hand-written social icon components | PR: `components/social-icons` from a sprite, zero JS |
| [timlrx/tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) | The upstream of the one above, very popular | Issue proposing the same change, linking the i18n fork PR |
| [shadcn-ui/taxonomy](https://github.com/shadcn-ui/taxonomy) and shadcn templates | App Router reference apps; icons via lucide-react today | Not a fit for the main pitch (public icon set); mention only if they add custom brand icons |
| [t3-oss/create-t3-app](https://github.com/t3-oss/create-t3-app) | Scaffolder, App Router | No icons by default; skip unless they add a "with icons" option |
| [ixartz/Next-js-Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) | Popular boilerplate, App Router | Issue: "icon sprite option"; they list integrations in the README |
| Vercel templates (vercel.com/templates) | Discoverability | Submit the example app as a template once v0.1.0 is out |

Record each proposal in `docs/metrics/manual.json` (`starters` when adopted, `targetListPrs` for PRs) so the weekly snapshot and the 12-week review see it.

## Launch date

Record it in three places when `0.1.0` is published: TSK-018, `docs/metrics/manual.json` (`launchDate`), and `docs/traction.md`. The kill-criteria review is that date + 84 days (`node scripts/traction-snapshot.mjs --review`).
