# svgworm + Next.js 16 App Router (Turbopack)

The documented svgworm setup, as a runnable app: `svgworm` runs before `dev` and `build`, a Server Component `Icon` renders every icon from the content-hashed sprite in `public/icons/`, and a script proves that no icon code reaches the client chunks.

```bash
# from the repo root
pnpm install && pnpm build        # build svgworm and @svgworm/react
pnpm example:build                # svgworm, then next build (Turbopack)
pnpm example:check                # svgworm check, build, then the zero-client-JS check
pnpm --filter svgworm-example-next-app-router dev   # svgworm, then next dev
```

What to look at:

| File | Role |
|------|------|
| `svgworm.config.json` | Points the CLI at `icons/`. Everything else is a default |
| `components/icon.tsx` | `createIcon(manifest)` once, in a Server Component file |
| `app/page.tsx` | Renders every icon from the manifest, plus size, color, `title` and `label` examples |
| `next.config.ts` | The `headers()` rule that caches `/icons/*` for a year |
| `scripts/check-client-chunks.mjs` | Fails when a client chunk mentions the adapter, a sprite URL or a symbol id, or when the prerendered HTML lacks the `<use href>` and stack references |
| `public/icons/`, `svgworm/` | Generated output, committed so `svgworm check` can fail CI when an icon changes without a rebuild |

The icons are fixtures from the repo (`fixtures/LICENSES.md`): mono fills, a stroke icon, multicolor logos, a gradient (`img` delivery), a mask (`mask` delivery), and a non-ASCII name.

CI runs `pnpm example:check` in the `example` job of `.github/workflows/ci.yml`. `svgworm check` runs before the build, so it fails when an icon changed and the output in git was not rebuilt.
