# svgworm site

The landing page, built with Astro and deployed to Cloudflare Workers static assets ([ADR-0016](../../docs/adr/0016-project-site-astro-on-cloudflare-workers.md)). It is also a demo: every icon comes from a hashed svgworm sprite rendered by `@svgworm/react`, the page ships no JavaScript, and `/icons/*` is served `immutable`.

```bash
# from the repo root
pnpm install && pnpm build        # build svgworm and @svgworm/react
pnpm site:build                   # svgworm, then astro build into apps/site/dist
pnpm site:check                   # svgworm check, build, then the output check
pnpm --filter svgworm-site dev    # svgworm, then astro dev
```

| File | Role |
|------|------|
| `src/pages/index.astro` | The page shell. Renders `Landing` with `react-dom/server`, so no React reaches the client |
| `src/components/landing.tsx` | The page content |
| `src/components/icon.tsx` | `createIcon(manifest)`, as in a Next.js app |
| `icons/` | Lucide SVGs (ISC, mono) and Fluent Emoji Flat SVGs in `icons/emoji/` (MIT, multicolor), see `LICENSES.md` |
| `public/icons/`, `svgworm/` | Generated output, committed so `svgworm check` fails CI when an icon changes without a rebuild |
| `public/_headers` | `Cache-Control: public, max-age=31536000, immutable` for `/icons/*` and `/fonts/*` |
| `scripts/check-output.mjs` | Fails on a `<script>` tag or a `.js` file in `dist/`, an unknown or unused sprite icon, or a missing cache rule |
| `wrangler.jsonc` | The assets-only Worker `svgworm`, with preview URLs on |

There is no `@astrojs/react`: Astro always emits a renderer's client entrypoint into `dist/`, even when no component hydrates.

## Deploys

`.github/workflows/site.yml` runs `pnpm site:check`, then `wrangler deploy` on every push to `main`, or `wrangler versions upload --preview-alias pr-<number>` on a same-repo PR (the URL is in the job summary). Fork PRs skip the job. It needs the repo secrets `CLOUDFLARE_API_TOKEN` (a token with the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`. Preview uploads need the Worker to exist, so the first deploy must come from `main` (or `pnpm --filter svgworm-site cf:deploy` by hand; `pnpm deploy` is a built-in pnpm command, hence the prefix).
