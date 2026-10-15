# svgworm + Vite 8 and React

The documented svgworm setup for a client-rendered Vite app ([guide](https://svgworm.com/docs/vite/)): `svgworm` runs before `dev` and `build`, and an `Icon` component draws every icon from the content-hashed sprite in `public/icons/`. Scripts prove that the build references that sprite, ships it, and works under a Vite `base`.

The app renders on the client, so the manifest is in the bundle. The sprite is a separate cached file and is not JavaScript.

```bash
# from the repo root
pnpm install && pnpm build        # build svgworm and @svgworm/react
pnpm example:vite:build           # svgworm, tsc, then vite build
pnpm example:vite:check           # svgworm check, build, check:dist, then check:base
pnpm --filter svgworm-example-vite-react dev   # svgworm, then vite
```

What to look at:

| File | Role |
|------|------|
| `svgworm.config.json` | Points the CLI at `icons/`. Everything else is a default |
| `src/icon.tsx` | `createIcon(manifest)` once |
| `src/app.tsx` | Renders every icon from the manifest, plus size, color, `title` and `label` examples |
| `scripts/check-dist.mjs` | After `vite build`: the bundle contains every sprite URL and icon id, each URL is `<base>icons/<file>`, the file is in `dist/icons/`, and `dist/icons/` has no file outside the manifest |
| `scripts/check-base.mjs` | Builds with `--base /app/` and `svgworm --public-path /app/icons` into `dist-base/`, runs `check-dist` on it, then restores the default output |
| `public/icons/`, `svgworm/` | Generated output, committed so `svgworm check` can fail CI when an icon changes without a rebuild |

The icons are fixtures from the repo (`fixtures/LICENSES.md`): two mono icons (heroicons, simple-icons) and two multicolor logos (flat-color-icons, logos), one of them delivered through the stack file.

Vite has no header setting for `public/`, so cache headers for `/icons/*` belong to the host; the guide shows the rules.
