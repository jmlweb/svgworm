---
id: TSK-036
title: Project website: Astro landing page on Cloudflare Workers
status: complete
priority: P2
tags: [adoption, site, adr]
created: 2026-10-14
source: manual
depends-on: []
started: 2026-10-14
completed: 2026-10-14
---

# Project website: Astro landing page on Cloudflare Workers

## Description

Build a one-page landing site in a new private workspace package, `apps/site`, with Astro. `@svgworm/react` renders the icons at build time (through `react-dom/server`, not `@astrojs/react`, see ADR-0016) from svgworm's external sprite, and the page ships no client JS. Deploy to Cloudflare Workers static assets (`svgworm.<account subdomain>.workers.dev`) with a GitHub Actions workflow that builds the workspace and runs `wrangler deploy`, with a preview version (`wrangler versions upload --preview-alias pr-<n>`) for each same-repo PR. A `_headers` file marks the hashed sprites `immutable`, which shows the cache benefit for real.

The copy keeps Next.js as the lead story, because TSK-024 deferred Astro to avoid diluting the Next.js positioning. The visuals follow the design system artifact (see CLAUDE.local.md). An ADR records the choice of Astro and Cloudflare hosting (`.claude/rules/decisions.md`), and it also amends ADR-0008's package layout with a new `apps/*` workspace glob.

Decided with the maintainer on 2026-10-14: landing page only (no docs site), a free Cloudflare subdomain for now (first `svgworm.pages.dev`; changed to workers.dev the same day when Pages was swapped for Workers, see ADR-0016), and deploys from GitHub Actions with wrangler (secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Acceptance Criteria

- [x] ADR for the site stack and hosting accepted, with evidence: Astro, Cloudflare Pages vs Workers static assets compared from current docs, dev dependencies (incl. @astrojs/check), and the apps/* layout amending ADR-0008 — evidence: docs/adr/0016-project-site-astro-on-cloudflare-workers.md, status accepted (2026-10-14)
- [x] apps/site is a private package under a new apps/* glob in pnpm-workspace.yaml, and ADR-0008's layout tree is superseded or amended accordingly — evidence: pnpm-workspace.yaml apps/*; apps/site private; ADR-0016 amends ADR-0008 layout (2026-10-14)
- [x] apps/site builds with Astro and the output has no client JS (no `<script>` tags, no `_astro/*.js`), checked by a script like example:check — evidence: pnpm site:check: no client JS in dist (negative control with a .js file exits 1) (2026-10-14)
- [x] Icons come from a hashed svgworm sprite through @svgworm/react, and the committed output is checked in CI — evidence: apps/site/public/icons + svgworm/ committed; svgworm check runs in site:check, CI job site (2026-10-14)
- [x] Root `site:build` / `site:check` scripts exist (run after `pnpm build`), kept out of `verify` like `example:*`, and run in a CI job — evidence: root site:build/site:check, not in verify; ci.yml job site (2026-10-14)
- [x] oxlint, oxfmt and `pnpm -r typecheck` handle apps/site: `.astro` files and `apps/site/{dist,.astro}/` ignored or supported, typecheck via `astro check` — evidence: pnpm lint, pnpm format:check, pnpm typecheck (astro check, invalid icon name fails) exit 0 (2026-10-14)
- [x] Site-only PRs don't trigger the changeset reminder (changeset config `ignore` or `privatePackages`) — evidence: changeset status: site-only commit exit 0, packages/react commit exit 1 (throwaway worktree); privatePackages version false (2026-10-14)
- [x] Production deploys to svgworm.<subdomain>.workers.dev from main, and every same-repo PR gets a preview URL; fork PRs skip the deploy job (no secrets) without failing CI — evidence: PR #5: Site run 38645353007 uploaded pr-5-svgworm.jmlweb.workers.dev (200, immutable sprite, 0 scripts); merge to main: Site run 38645693940 wrangler deploy, version 3113e0c2, live at svgworm.jmlweb.workers.dev. Fork gating: if github.event.pull_request.head.repo.fork == false (2026-10-14)
- [x] _headers serves /icons/* with Cache-Control: public, max-age=31536000, immutable, verified on the live site — evidence: curl -sI https://svgworm.jmlweb.workers.dev/icons/icons.7ced95d4.svg: cache-control public, max-age=31536000, immutable (2026-10-14)
- [x] README and llms.txt link to the site — evidence: README.md and llms.txt link https://svgworm.jmlweb.workers.dev (2026-10-14)

## Notes

- Location: `apps/site`, not `packages/site` (root `build`, `typecheck:ts7` and `check:packages` filter `./packages/*`) nor `examples/site` (not an example; `examples/*/svgworm/**` ignore globs would match). Roles: `packages/` published, `examples/` documented usage, `apps/` deployed.
- `examples/next-app-router` stays where it is: its path is public in README, llms.txt, context7.json, docs/nextjs.md, outreach and posts. Revisit only at a breaking-docs moment such as 1.0.
- Fork PRs: gate the deploy job on `github.event.pull_request.head.repo.fork == false`.
- Consider splitting if it grows: (a) ADR, (b) site plus checks, (c) deploy, `_headers` and links.

## Learnings

- LRN-033: @astrojs/react ships its client renderer even when nothing hydrates
- LRN-034: gh secret set without --body stores an empty value outside a terminal
- LRN-035: changeset status skips private packages, so site-only PRs need no changeset
## Progress Log

- [2026-10-14] Created
- [2026-10-14] Design follows the svgworm Design System artifact (project/README.md, tokens.json): surface/ink/accent tokens with a prefers-color-scheme dark theme; Bricolage Grotesque 800 for display and headings, Instrument Sans for body, JetBrains Mono for code; code and terminal on surface-raised with radius-md; logo-light/logo-dark from docs/assets per theme, logo-mark as favicon; flat SVG illustrations with soil strata bands.
- [2026-10-14] Fonts are self-hosted (OFL woff2 files committed with their licenses), not loaded from Google Fonts.
- [2026-10-14] Demo icons are a Lucide (ISC) subset of about 10-15 icons, with source and license recorded like fixtures/LICENSES.md.
- [2026-10-14] Validated: site moves to apps/site (new apps/* glob, recorded in the ADR as an ADR-0008 layout amendment); Next.js example stays in examples/.
- [2026-10-14] Added ACs for fork-PR deploy gating, Pages vs Workers comparison, lint/format/typecheck of .astro, changeset reminder, site:build/site:check scripts and CI job.
- [2026-10-14] Started
- [2026-10-14] Host changed from Pages to Workers static assets with the maintainer's OK: Cloudflare docs say to start new projects on Workers (ADR-0016). Previews use wrangler versions upload --preview-alias pr-<n>.
- [2026-10-14] Dropped @astrojs/react: Astro always emits a renderer's client entrypoint (static-build.js getClientInput), which left a 220 KB unreferenced React runtime in dist/_astro. The page renders Landing with react-dom/server renderToStaticMarkup instead.
- [2026-10-14] Built apps/site: 13 Lucide icons, self-hosted OFL fonts, design system tokens, light/dark, checked at 390px and 1280px in Chromium. Output check script, _headers, wrangler.jsonc (wrangler deploy --dry-run ok), CI site job, site.yml deploy workflow with fork gating.
- [2026-10-14] Blocked on the maintainer: Cloudflare secrets and the account's workers.dev subdomain. Live deploy, live _headers check, and README/llms.txt links (AC 8-10) wait for them.
- [2026-10-14] Redesigned the page (hero with terminal, animated soil band, stats strip, bento features, dark demo section); design system used as guidance, not strict rules.
- [2026-10-14] Accessibility audit: axe-core (WCAG 2.0-2.2 A/AA + best practice) 0 violations in light/dark at 1280 and 390px. Fixed: autocomplete label contrast (4.2:1), hero lede over glow in dark mobile (4.17:1, measured from rendered pixels), endless motion (WCAG 2.2.2, now stops under 5 s), 320px reflow (swatches), added skip link.
- [2026-10-14] First production deploy by hand (wrangler deploy from a laptop): https://svgworm.jmlweb.workers.dev, version 6e93186f. Live check: sprite and fonts immutable, page has no <script>, unknown path 404. Renamed the site's deploy script to cf:deploy because pnpm deploy is a pnpm built-in.
- [2026-10-14] AC 8 still open: CI deploys need the CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID secrets, then a PR to check the preview and a merge to check the deploy from main.
- [2026-10-14] PR #5 merged. CI deployed production from main (version 3113e0c2); preview alias pr-5 worked on the PR. All 10 acceptance criteria met.
- [2026-10-14] Completed