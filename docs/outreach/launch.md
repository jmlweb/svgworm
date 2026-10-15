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
| r/nextjs, r/reactjs | Link post with the first paragraph as text | Disclose authorship. Answer every comment within 24 h |
| This Week in React | Submit via the newsletter form | Short blurb plus the color number |
| Bytes, JavaScript Weekly | Submit link | Same blurb |
| Bluesky, X | The 5-tweet thread from the pre-launch post, updated with the npm link | One before/after image |
| Hacker News "Show HN" | Only if the post stands on its numbers; title names the measurement, not the tool | Be around for 3 hours after posting |
| GitHub Discussions (vercel/next.js), Stack Overflow | Answer existing questions about SVG sprites in App Router or icons in Server Components | Answer first, mention svgworm only where it fits |

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
