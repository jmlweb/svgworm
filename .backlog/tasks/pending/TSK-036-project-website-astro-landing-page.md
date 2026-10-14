---
id: TSK-036
title: Project website: Astro landing page on Cloudflare Pages
status: pending
priority: P2
tags: [adoption, site, adr]
created: 2026-10-14
source: manual
depends-on: []
---

# Project website: Astro landing page on Cloudflare Pages

## Description

Build a one-page landing site in a new private workspace package, `apps/site`, with Astro and `@astrojs/react`. `@svgworm/react` renders the icons at build time from svgworm's external sprite, and the page ships no client JS. Deploy to `svgworm.pages.dev` with a GitHub Actions workflow that builds the workspace and runs `wrangler pages deploy`, with a preview for each same-repo PR. A `_headers` file marks the hashed sprites `immutable`, which shows the cache benefit for real.

The copy keeps Next.js as the lead story, because TSK-024 deferred Astro to avoid diluting the Next.js positioning. The visuals follow the design system artifact (see CLAUDE.local.md). An ADR records the choice of Astro and Cloudflare hosting (`.claude/rules/decisions.md`), and it also amends ADR-0008's package layout with a new `apps/*` workspace glob.

Decided with the maintainer on 2026-10-14: landing page only (no docs site), the `svgworm.pages.dev` subdomain for now, and deploys from GitHub Actions with wrangler (secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`).

## Acceptance Criteria

- [ ] ADR for the site stack and hosting accepted, with evidence: Astro, Cloudflare Pages vs Workers static assets compared from current docs, dev dependencies (incl. @astrojs/check), and the apps/* layout amending ADR-0008
- [ ] apps/site is a private package under a new apps/* glob in pnpm-workspace.yaml, and ADR-0008's layout tree is superseded or amended accordingly
- [ ] apps/site builds with Astro and the output has no client JS (no `<script>` tags, no `_astro/*.js`), checked by a script like example:check
- [ ] Icons come from a hashed svgworm sprite through @svgworm/react, and the committed output is checked in CI
- [ ] Root `site:build` / `site:check` scripts exist (run after `pnpm build`), kept out of `verify` like `example:*`, and run in a CI job
- [ ] oxlint, oxfmt and `pnpm -r typecheck` handle apps/site: `.astro` files and `apps/site/{dist,.astro}/` ignored or supported, typecheck via `astro check`
- [ ] Site-only PRs don't trigger the changeset reminder (changeset config `ignore` or `privatePackages`)
- [ ] Production deploys to svgworm.pages.dev from main, and every same-repo PR gets a preview URL; fork PRs skip the deploy job (no secrets) without failing CI
- [ ] _headers serves /icons/* with Cache-Control: public, max-age=31536000, immutable, verified on the live site
- [ ] README and llms.txt link to the site

## Notes

- Location: `apps/site`, not `packages/site` (root `build`, `typecheck:ts7` and `check:packages` filter `./packages/*`) nor `examples/site` (not an example; `examples/*/svgworm/**` ignore globs would match). Roles: `packages/` published, `examples/` documented usage, `apps/` deployed.
- `examples/next-app-router` stays where it is: its path is public in README, llms.txt, context7.json, docs/nextjs.md, outreach and posts. Revisit only at a breaking-docs moment such as 1.0.
- Fork PRs: gate the deploy job on `github.event.pull_request.head.repo.fork == false`.
- Consider splitting if it grows: (a) ADR, (b) site plus checks, (c) deploy, `_headers` and links.

## Learnings

## Progress Log

- [2026-10-14] Created
- [2026-10-14] Design follows the svgworm Design System artifact (project/README.md, tokens.json): surface/ink/accent tokens with a prefers-color-scheme dark theme; Bricolage Grotesque 800 for display and headings, Instrument Sans for body, JetBrains Mono for code; code and terminal on surface-raised with radius-md; logo-light/logo-dark from docs/assets per theme, logo-mark as favicon; flat SVG illustrations with soil strata bands.
- [2026-10-14] Fonts are self-hosted (OFL woff2 files committed with their licenses), not loaded from Google Fonts.
- [2026-10-14] Demo icons are a Lucide (ISC) subset of about 10-15 icons, with source and license recorded like fixtures/LICENSES.md.
- [2026-10-14] Validated: site moves to apps/site (new apps/* glob, recorded in the ADR as an ADR-0008 layout amendment); Next.js example stays in examples/.
- [2026-10-14] Added ACs for fork-PR deploy gating, Pages vs Workers comparison, lint/format/typecheck of .astro, changeset reminder, site:build/site:check scripts and CI job.