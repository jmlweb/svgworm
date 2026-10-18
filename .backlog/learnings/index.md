# svgworm - Learnings Index

> Consult a learning's full document before starting related work.

| ID | Title | Tags | Status | Date |
|----|-------|------|--------|------|
| LRN-001 | Prototype svgo pipeline worth porting as idea | svgo, optimization, prototype | active | 2026-10-07 |
| LRN-002 | Prototype file mode never linked sprite URL to Icon | prototype, delivery, manifest | active | 2026-10-07 |
| LRN-003 | Prototype ids were crawl-order dependent | prototype, naming, determinism | active | 2026-10-07 |
| LRN-004 | Old svg/ fixtures likely proprietary | fixtures, licensing | active | 2026-10-07 |
| LRN-005 | Transparent gradient stops still tint color | color, svg, gradient | active | 2026-10-07 |
| LRN-006 | Recolor masks only after freezing inherited fill | color, svg, mask | active | 2026-10-07 |
| LRN-007 | resvg-js returns premultiplied pixels and can abort | testing, rendering, resvg | active | 2026-10-07 |
| LRN-008 | neodx defaults break colors and Turbopack setup | competitor, neodx, nextjs | active | 2026-10-07 |
| LRN-009 | Hand-edited task title or priority leaves index stale | backlog, flowstate, index | active | 2026-10-07 |
| LRN-010 | Icon name and symbol id must be different strings | naming, output-contract, svg | active | 2026-10-07 |
| LRN-011 | NFC alone doesn't make names case- and order-stable | unicode, determinism, naming | active | 2026-10-07 |
| LRN-012 | Don't use . as the internal-id delimiter in sprites | svgo, sprite, ids | active | 2026-10-07 |
| LRN-013 | TypeScript 7 blocked typescript-eslint, not type-aware linting (superseded by ADR-0011) | tooling, typescript, adr | active | 2026-10-07 |
| LRN-014 | Modern Node built-ins replace most CLI dependencies | tooling, dependencies, cli | active | 2026-10-07 |
| LRN-015 | svgo has no public parse function | svgo, parser | active | 2026-10-07 |
| LRN-016 | Agent worktrees may be created from main, not next | workflow, agents, git | archived | 2026-10-07 |
| LRN-017 | WebKit ignores url(#...) references in external use sprites | browser, svg, sprite, webkit, delivery, testing | active | 2026-10-07 |
| LRN-018 | Next.js public/ is the right home for use-href sprites, but basePath and caching are manual | nextjs, delivery, caching, same-origin, output-contract | active | 2026-10-08 |
| LRN-019 | Browser render checks need a negative control; WebKit collapses a broken alt-less img | testing, browser-check, playwright, webkit | active | 2026-10-08 |
| LRN-020 | Scaffold gotchas: TS 7 via pnpm dlx, passWithNoTests, Markdown rewritten by formatters (ESLint parts obsolete) | tooling, eslint, typescript, pnpm | active | 2026-10-11 |
| LRN-021 | Worktree agents: rtk-rewritten git commands are refused; use /usr/bin/env git | tooling, worktree, git | active | 2026-10-11 |
| LRN-022 | Oxlint config gotchas: no extends in overrides, no restricted-properties, typeAware root-only | tooling, oxlint, lint, monorepo | active | 2026-10-11 |
| LRN-023 | Task scope text goes stale when later ADRs change a decision | design, contract, adr | active | 2026-10-11 |
| LRN-024 | Spike-made contract samples must come from the product pipeline | output-contract, svgo, determinism | active | 2026-10-11 |
| LRN-025 | oxlint can die with a possible out-of-memory error | tooling, oxlint, flaky | active | 2026-10-11 |
| LRN-026 | Parallel worktree agents branched from main, not the current branch | worktree, parallel, flowstate, git | archived | 2026-10-12 |
| LRN-027 | React 19 prepends a preload link to server-rendered img | react, rsc, testing, adapter | active | 2026-10-12 |
| LRN-028 | Turbopack resolves imports by file extension, not by TypeScript's .js-to-.ts mapping | nextjs, turbopack, typescript, example | active | 2026-10-12 |
| LRN-029 | svgworm check must run before the build in CI, or it proves nothing | ci, check, example | active | 2026-10-12 |
| LRN-030 | Benchmark consumers must type-check cleanly or the negative control proves nothing | benchmark, typescript, testing | active | 2026-10-12 |
| LRN-031 | Validate SVG by local name and review 'done' code before a release | security, svg, validation, review, cli, watch, fs | active | 2026-10-12 |
| LRN-032 | First npm publish: dry-run first, expect staging, bin paths without ./ | release, npm, publishing, cli, bin | active | 2026-10-12 |
| LRN-033 | @astrojs/react ships its client renderer even when nothing hydrates | astro, react, static-site, bundle | active | 2026-10-14 |
| LRN-034 | gh secret set without --body stores an empty value outside a terminal | github, secrets, cli | active | 2026-10-14 |
| LRN-035 | changeset status skips private packages, so site-only PRs need no changeset | changesets, monorepo, release | active | 2026-10-14 |
| LRN-036 | Astro 7 needs a new package for any Markdown plugin; context7.json excludes match by name | astro, markdown, dependencies, context7, site | active | 2026-10-14 |
| LRN-037 | LinkedIn article publish dialog replaces a separate share post | traction, content, linkedin | active | 2026-10-15 |
| LRN-038 | skills.sh lists a skill only after an install and an index crawl | agents, discovery, skills, traction | active | 2026-10-15 |
| LRN-039 | Preload can't match a <use> fetch, and Playwright WebKit/Firefox contexts fake cold-cache results | browser, sprite, delivery, performance, playwright, testing, webkit | active | 2026-10-15 |
| LRN-040 | Plain svgworm needs sources from a config file; manual setup docs must pass --source | docs, cli, config, onboarding | active | 2026-10-15 |
| LRN-041 | Yarn 2+ silently skips pre/post scripts; detect Berry and prefix dev/build | package-managers, yarn, init, cli | active | 2026-10-15 |
| LRN-042 | pnpm installs packages as symlinks: stat the source root, lstat only inside | pnpm, symlink, discover, sources, node_modules | active | 2026-10-15 |
| LRN-043 | pnpm verify does not catch stale committed example or site output | testing, ci, example, output | active | 2026-10-15 |
| LRN-044 | Custom properties reach var() paints inside an external use sprite | color, css-variables, browsers, delivery | active | 2026-10-15 |
| LRN-045 | A new vite version in any workspace package splits vitest's vite peer and untypes vitest configs | tooling, vite, vitest, pnpm, lint | active | 2026-10-15 |
| LRN-046 | An XML-illegal character in a spike payload makes DOMParser reject the whole sprite | security, svg, spike, testing | active | 2026-10-15 |
| LRN-047 | <use> draws a symbol at 0,0: the consumer viewBox must not carry the icon's origin | svg, use, viewbox, render, fixtures | active | 2026-10-15 |
| LRN-048 | svgo plugins can carry svgworm's own steps through one optimize() run | svgo, perf, core, errors | active | 2026-10-16 |
| LRN-049 | Worker threads cost ~100 ms each to boot svgo; not worth it under ~2k icons | perf, core, svgo, spike | active | 2026-10-16 |
| LRN-050 | Vite's closeServer plugin hook first ships in 8.3.0 | vite, plugin, tooling | active | 2026-10-16 |
| LRN-051 | Vite replays a pre-connect error payload to the first client only | vite, plugin, dev-server | active | 2026-10-16 |
| LRN-052 | A bundler plugin must not derive output the CLI cannot reproduce | vite, plugin, config, determinism | active | 2026-10-16 |
| LRN-053 | Real fs.watch in Vitest plugin tests aborted the macOS CI runner | testing, ci, macos, watch, vite | active | 2026-10-16 |
| LRN-054 | Vue SSR lowercases attribute names bound through a v-bind object | vue, ssr, svg, conformance | active | 2026-10-16 |
| LRN-055 | Svelte SSR adds inline onload/onerror replay handlers to an img with spread attributes | svelte, ssr, csp, img, conformance | active | 2026-10-16 |
| LRN-056 | SvelteKit serves static/, not public/: sprite outDir must follow | sveltekit, svelte, init, outdir, public-path | active | 2026-10-16 |
| LRN-057 | Server-render Vue SFCs and Svelte components in Vitest without bundler plugins | testing, vue, svelte, ssr, conformance, vitest | active | 2026-10-16 |
| LRN-058 | TypeScript 7 has no JS compiler API, and an optional peer upper bound still breaks npm install | typescript, peer-dependencies, npm, codemod | active | 2026-10-17 |
| LRN-059 | getSymbolAtLocation on { Logo } and export { Logo } returns their own symbol, not the import | typescript, compiler-api, codemod | active | 2026-10-17 |
| LRN-060 | Worktree-guard refusals continued after LRN-021: the rule must be in the agent prompt | workflow, worktree, agents, git | active | 2026-10-18 |
