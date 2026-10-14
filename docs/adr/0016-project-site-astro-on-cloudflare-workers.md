# 0016. Project site: Astro on Cloudflare Workers static assets, in apps/site

- **Status:** accepted
- **Date:** 2026-10-14
- **Task:** TSK-036
- **Resolves:** none. Amends only the "Package layout" section of [ADR-0008](0008-tech-stack-and-package-layout.md) with an `apps/*` workspace glob. The rest of ADR-0008 stays in force, and ADR-0008 itself is not edited.

## Context

svgworm needs a landing page that people and agents can link to. The page is also a demo: it should render its own icons through `@svgworm/react` from a hashed external sprite, ship no client JavaScript, and serve the sprite with a year-long `immutable` cache, so the claims in the README can be checked on a live site.

The maintainer set the scope on 2026-10-14: a landing page only (no docs site), a free Cloudflare subdomain for now, deploys from GitHub Actions with wrangler, and a preview for each same-repo PR. Choosing a build tool and a host needs an ADR (`.claude/rules/decisions.md`), and the site is a new kind of workspace package that ADR-0008's layout does not cover.

## Options considered

### Site generator

1. **Astro with `@astrojs/react`.** Chosen. Astro renders framework components to static HTML at build time and sends no JavaScript for a component without a `client:*` directive ([framework components guide](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/framework-components.mdx)). `output: 'static'` is the default. So `@svgworm/react` runs exactly as it does in a Server Component, and the page ships zero JS. `astro check` (from `@astrojs/check`) type-checks `.astro` files, which `astro build` does not do ([TypeScript guide](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/typescript.mdx)).
2. **Next.js static export**, reusing the stack of `examples/next-app-router`. Rejected: a static export still loads the React runtime and the router on the client, so the page would not show "zero client JS", and it would duplicate the example.
3. **Hand-written HTML.** No dependencies, but it cannot demo the adapter: the icons would be hand-written `<use href>` markup, not `@svgworm/react` output.

### Host

1. **Cloudflare Workers static assets** (an assets-only Worker, no script). Chosen. Cloudflare's own docs now say: "Workers Static Assets is the recommended way to deploy static sites [...] If you are starting a new project, use Workers instead of Pages. Pages continues to work, but new features and optimizations are focused on Workers" ([Workers best practices](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/best-practices/workers-best-practices.mdx)). The Pages docs carry the same note ("Start new projects with Workers", [partial](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/pages/workers-for-new-projects.mdx)). What this site needs is all there:
   - a purely static site needs only `assets.directory`, no Worker script;
   - a `_headers` file in the assets directory sets response headers ([headers](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/static-assets/headers.mdx));
   - `wrangler versions upload --preview-alias <alias>` (Wrangler 4.21.0+) gives a stable `<alias>-<worker>.<subdomain>.workers.dev` URL per PR without touching production, once `preview_urls` is on ([version URLs](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/workers/versions-and-deployments/version-urls.mdx), [preview URL setting](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/changelog/workers/2025-09-17-update-preview-url-setting.mdx)).
2. **Cloudflare Pages** (`wrangler pages deploy`, `svgworm.pages.dev`). The first plan in TSK-036. It also supports `_headers` and preview deployments per branch. Rejected because Cloudflare points new projects at Workers and focuses new features there; a later move would change the public URL.
3. **GitHub Pages.** No secrets needed, but it cannot set `Cache-Control` per path, so the `immutable` cache, which is the point of the demo, would be impossible.

### Location

1. **`apps/site` under a new `apps/*` glob.** Chosen. The roles become: `packages/` is published, `examples/` is documented usage, `apps/` is deployed.
2. `packages/site`: the root `build`, `typecheck:ts7` and `check:packages` scripts filter `./packages/*`, so a private site there would be built and checked as if it were a package.
3. `examples/site`: the site is not an example, and the `examples/*/svgworm/**` ignore globs would match it by accident.

## Decision

- **Layout (amends ADR-0008):** `pnpm-workspace.yaml` gains `apps/*`. `apps/site` is a private package, `svgworm-site`, never published.

  ```
  packages/   # published to npm (svgworm, @svgworm/react)
  examples/   # documented usage (next-app-router)
  apps/       # deployed, private (site)
  ```

  `examples/next-app-router` stays where it is: its path is public in the README, `llms.txt`, `context7.json`, `docs/nextjs.md`, outreach and posts.
- **Stack:** Astro with `@astrojs/react`, `output: 'static'`, no `client:*` directive anywhere. Icons are Lucide (ISC, mono) and Fluent Emoji Flat (MIT, multicolor) SVGs, compiled by the workspace `svgworm` CLI into `public/icons/` and `svgworm/`, both committed, and rendered by `@svgworm/react`. Fonts are self-hosted OFL woff2 files from Fontsource, not loaded from Google Fonts, so the page makes no third-party requests.
- **Checks:** `pnpm site:check` runs `svgworm check` (committed output is current), builds, then fails if `dist/` has a `<script>` tag, any `.js` file, or a page without the expected `<use href>` sprite references. Like `example:*`, it runs after `pnpm build` and is not part of `verify`. `astro check` is the package's `typecheck`, so `pnpm -r typecheck` covers it.
- **Host:** an assets-only Worker named `svgworm`, configured in `apps/site/wrangler.jsonc`. `_headers` serves `/icons/*` with `Cache-Control: public, max-age=31536000, immutable`.
- **Deploys:** a GitHub Actions workflow runs `wrangler deploy` on every push to `main`, and `wrangler versions upload --preview-alias pr-<number>` on every same-repo PR. Fork PRs skip the job (`github.event.pull_request.head.repo.fork == false`), because they get no secrets. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- **Changesets:** the site is private. `changeset status` already skips private packages (checked in a throwaway worktree: a site-only commit passes, a commit to `packages/react` exits 1), so the reminder stays quiet for site-only PRs. `.changeset/config.json` also sets `privatePackages: { version: false, tag: false }`, so private packages are never bumped.

Versions (dev, pinned exactly, each at least two weeks old on 2026-10-14): `astro` 7.3.5, `@astrojs/react` 7.0.0, `@astrojs/check` 0.9.10, `wrangler` 4.144.0, `react` and `react-dom` 19.3.0, `typescript` 6.0.3. Content sources, not dependencies: `lucide-static` 1.52.0 (ISC, same version as `fixtures/`), `@iconify-json/fluent-emoji-flat` 1.2.6 (MIT, as in `fixtures/`) and `@fontsource-variable/*` 5.3.0 for Bricolage Grotesque, Instrument Sans and JetBrains Mono (OFL-1.1), recorded in `apps/site/LICENSES.md`.

## Evidence

- Astro docs (Context7, `/withastro/docs`): framework components render to HTML with no client JS by default; `output: 'static'` is the default; `astro check` is the type checker.
- Cloudflare docs (Context7, `/cloudflare/cloudflare-docs`), linked above: Workers recommended for new projects, `_headers` on static assets, preview aliases and `preview_urls`.
- `pnpm site:check` on the built site: no `<script>` tags and no `.js` files in `dist/` (TSK-036 progress log).

## Consequences

- The live URL is `svgworm.<account subdomain>.workers.dev`, not `svgworm.pages.dev`. A custom domain can be added later as a route without changing the deploy flow.
- The site adds dev dependencies only to `apps/site`; `svgworm` and `@svgworm/react` gain nothing, and their dependency budgets are unchanged.
- Oxlint lints the frontmatter of `.astro` files; Oxfmt does not format them, so they are excluded from Oxfmt. The page content lives in `.tsx` files that both tools cover, and `astro check` type-checks the `.astro` files.
- Two deploy secrets live in the repo settings. A PR from a fork gets no preview; a maintainer can push the branch to the repo to get one.
