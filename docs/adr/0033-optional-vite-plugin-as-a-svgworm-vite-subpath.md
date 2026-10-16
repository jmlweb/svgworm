# 0033. Optional Vite plugin as a `svgworm/vite` subpath

- **Status:** accepted
- **Date:** 2026-10-16
- **Task:** TSK-091
- **Resolves:** none (follows Q-21, answered by TSK-024)

## Context

svgworm's Vite path (TSK-024, `examples/vite-react`) runs the CLI in `predev` and `prebuild`. During `vite dev`, a changed icon needs a second process (`svgworm watch`) or a restart. The Vite sprite plugins svgworm competes with (vite-plugin-icons-spritesheet, vite-plugin-svg-spritemap, @neodx/svg's unplugin; `docs/viability.md`) rebuild inside `vite dev`. For a Vite user, "run another watcher" is a migration blocker.

Three earlier decisions push against a plugin:

- ADR-0005 positions svgworm with "no bundler plugin needed", and `docs/vision.md` repeats it in the pitch.
- ADR-0008 lists "no bundler-plugin dependence" as a force. The TSK-007 spike showed @neodx/svg's documented webpack plugin failing under Next 16 + Turbopack, while a prebuild script worked.
- ADR-0029 leaves Vite's `base` underived: the user pairs `--base /app/` with `--public-path /app/icons` by hand, and the docs warn that every icon 404s when they forget.

The ADR-0005 risk is a plugin you *need*: one bundler's plugin becomes the only working path, and it breaks when that bundler changes. A plugin that is optional sugar over the CLI carries no such risk. The CLI keeps working, unchanged, under Turbopack, webpack, Vite and plain HTML.

## Options considered

1. **Keep the CLI only.** Document `svgworm watch` next to `vite dev` (`concurrently` or two terminals). No new surface. Cons: it keeps the migration blocker. Two processes also race: Vite may reload before svgworm finishes writing.
2. **A new `@svgworm/vite` package** with `svgworm` and `vite` as peers. Clean separation. Cons: a new npm package needs a manual first publish and its own trusted-publisher setup (`docs/release.md`, LRN-032), which only the maintainer can do. It joins the changeset `fixed` group, and it adds a third release tag and a third changelog for about 150 lines of code.
3. **A `svgworm/vite` subpath export of the existing package**, with `vite` as an optional peer. No new package and no release setup. The plugin calls the core's public API (`loadConfig`, `build`, `watch`), like the CLI. Cons: the `svgworm` package now contains Vite-specific code, so a lint boundary must keep `src/core` free of it. Its peer range moves with the `svgworm` version.
4. **An unplugin** (Vite, webpack, Rollup, esbuild, Rspack). Cons: it adds a runtime dependency to the ADR-0008 budget, and the bundler-plugin path is the one that broke under Turbopack (TSK-007). Next.js does not need it: `predev` works there.

## Decision

Option 3: ship `svgworm/vite`, an optional plugin, from the `svgworm` package.

- **Packaging.** `exports["./vite"]` points at `dist/vite/index.js`. `vite` is a peer `^8.3.0`, marked optional in `peerDependenciesMeta`, so installs without Vite see no warning. It is not a runtime dependency: the ADR-0008 cap of 3 is unchanged. 8.3.0 is the first Vite with the `closeServer` hook (checked against the published 8.0.0, 8.1.0, 8.2.0 and 8.3.0 type definitions). Vite 7 and earlier 8.x are not supported: without `closeServer`, the watcher would have to hang off `httpServer`, which is `null` in middleware mode, and principle 8 targets current versions only. A dev-only `vite@8.3.3` matches the version the workspace already uses (LRN-045).
- **API.** `svgworm(options?: { configFile?: string }): Plugin`, a named export. It reads `svgworm.config.json` (or `configFile`) from Vite's `root`, the same file and rules as the CLI.
- **`vite build`.** `buildStart` runs `build()` once, before Vite resolves any module, so the manifest and types exist and the sprite is in `public/` before Vite copies it. A failed build, or an invalid config, calls `this.error` with every diagnostic, and `vite build` exits non-zero. `vite build --app` can call `buildStart` once per environment. The plugin caches the build promise and every call awaits it, so no environment reads the manifest before it is written. A second build, if Vite recreates the plugin, writes byte-identical output (principle 2).
- **`vite dev`.** `configureServer` creates its abort controller before any await, then starts `watch()` and waits for its first build, so the server never serves a missing manifest. `closeServer` aborts the watch, even while the config loads or the first build runs, and waits for a build in flight. If `watch()` gives up (a source folder cannot be watched), the error says that watching stopped and `vite dev` needs a restart. Vite replays an error sent before any client connects to the first client only, so the plugin resends the last build error to every client that connects (`vite:client:connect`) until a good build clears it. Rebuilds write the manifest module, and Vite's own watcher turns that into an HMR update. A failed build or a watcher error is logged through the Vite logger and shown in the error overlay; the server keeps running and watching. The next good build sends a full reload, which clears the overlay even when the output did not change. An invalid config stops `vite dev` before it listens (the CLI's exit code 2).
- **Warnings** go to the Vite logger.
- **`base`: checked, never derived (keeps ADR-0029).** The plugin uses `publicPath` exactly as the config resolves it. When Vite's resolved `base` is a root path other than `/` and the config sets no `publicPath` (`ResolvedConfig.isDefaultPublicPath`), the plugin throws a `ConfigError` before building. That stops `vite dev` before it listens and fails `vite build`, with the value to set: `Vite base is "/app/" but svgworm publicPath is "/icons", so every icon would 404` / `set "publicPath": "/app/icons" in svgworm.config.json`. An explicit `publicPath` is trusted, even without the base prefix (the sprites may be served elsewhere on the origin). A relative base (`./`, `''`) or a full-URL base (`https://…`, `//…`) is not checked. A sprite URL must be a root path on the page's origin, or an explicit cross-origin `publicPath` with `crossOrigin: "inject"` (ADR-0027).
- **Boundaries.** The plugin lives in `src/vite` and imports only the core's public entry. Lint forbids `src/core` from importing `vite` or `src/vite`, and forbids `src/vite` from importing `src/cli` or `@clack/prompts`. The core gains one additive field, `ResolvedConfig.isDefaultPublicPath`. The output contract is unchanged.
- **Positioning.** The CLI stays the documented path for every bundler. `init` keeps writing `predev` and `prebuild`. The Vite guide presents the plugin as an optional replacement for those two scripts. The pitch becomes "no bundler plugin *required*".

## Evidence

- **Tests** (`packages/svgworm/src/vite/plugin.test.ts`, 23) drive real Vite 8.3.3 through `createServer` (middleware mode, Vite's own watcher off) and `build`. The svgworm file watcher is a fake the test fires by hand. On the first PR run, `pnpm test` aborted on macOS (exit 134) right after this file, when it still used real `fs.watch`. The suspected cause is FSEvents teardown racing the temp-folder removal; it was not reproduced locally. Hook-level tests cover two concurrent `buildStart` calls, a close during the first build, and the error replay to late clients. The cases:
  - build: writes the manifest before Vite reads the app;
  - base: fails `vite build` and `vite dev` under `base: '/app/'` with no `publicPath`, writing nothing, and builds `/app/icons/…` URLs when the config sets `publicPath`;
  - errors: fails the build on an invalid icon, writing nothing, and on an invalid config;
  - dev: builds before the server is ready and rebuilds on a new SVG;
  - dev errors: reports a failed build through the logger and recovers on the fix;
  - shutdown: closes its watchers on `server.close()`.

  `describeBaseMismatch` has unit tests for root, nested, relative, full-URL and protocol-relative bases, for a `publicPath` derived from `outDir`, and for an explicit `publicPath`.
- **Example** (`examples/vite-react`, run 2026-10-16): with the plugin in `vite.config.ts` and `predev`/`prebuild` removed:
  - `vite dev` logged `svgworm: built 4 icon(s)` before `ready`;
  - copying an icon to `icons/ui/home-copy.svg` rewrote the sprite (`icons.93edda38.svg` became `icons.06fa9311.svg`), `icons.js` and `icons.d.ts`, and Vite logged `hmr update /src/app.tsx` with no restart;
  - deleting the copy restored the committed output.

  `pnpm example:vite:check` passes. `check:base` builds with `vite.base.config.ts` (`base: '/app/'`, `svgworm({ configFile: 'svgworm.base.config.json' })` with `publicPath: "/app/icons"`), and `check-dist` confirms every URL is `/app/icons/<file>`.
- **Rejected alternative, derive `publicPath` from `base`.** It was prototyped first and dropped. In `examples/vite-react` on 2026-10-16, after `vite build --base /app/` with a derived URL, the committed manifest held `/app/icons/…`. A plain `svgworm check` then exited 1, `svgworm check --public-path /app/icons` exited 0, and a manual `svgworm` run rewrote the files back to `/icons`. The CLI cannot read `vite.config.*` (it is TypeScript run through Vite's loader), so the plugin and the CLI would silently disagree. Keeping the URL in the config, and failing loudly when it misses the base (principle 5), means the plugin, `svgworm` and `svgworm check` always write the same files.
- **Vite API**: the `configResolved`, `configureServer` and `buildStart` docs (Vite 8, via Context7). `closeServer`, `ErrorPayload` and `buildStart` running only once in dev unless `perEnvironmentStartEndDuringDev` is set all come from the installed `vite@8.3.3` `dist/node/index.d.ts`.

## Consequences

- Vite users get rebuild-on-change in `vite dev` with one line in `vite.config.ts`. A forgotten `base` in `publicPath` becomes a build error instead of a 404 on every icon.
- A `base` that changes per environment needs a svgworm config per environment (`svgworm({ configFile })`, or `--config` for the CLI). That is the same as without the plugin.
- The `svgworm` package now has a second shell beside the CLI, and its tests start real Vite servers, which is slower than unit tests. The waits use explicit timeouts (RPT-009). Real `fs.watch` stays covered by the core `watch` tests and the manual `vite dev` run above.
- `vite build --watch` builds the icons once, not on every change. Use `vite dev` or `svgworm watch` for that.
- Vitest starts a Vite dev server, so a Vitest config that includes the plugin runs the watcher during tests. Keep the plugin out of the test config, or accept the build.
- **`tsc` before `vite build`** (`tsc -b && vite build` in Vite's React template) runs before the plugin. With committed output it reads the committed `svgworm/icons.d.ts`. With ignored output it finds no types, so keep `svgworm &&` in front of `tsc` in that script.
- A webpack or Rspack plugin stays out of scope. A user request would need its own ADR.
