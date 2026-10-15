---
id: TSK-038
title: Docs on the website: render user docs from docs/, slim the README
status: complete
priority: P2
tags: [docs, site, discoverability]
created: 2026-10-14
source: manual
depends-on: []
started: 2026-10-14
completed: 2026-10-15
---

# Docs on the website: render user docs from docs/, slim the README

## Description

### Goal

Make https://svgworm.jmlweb.workers.dev the home of the user docs, and keep the repo README short and meaningful for humans while staying useful to agents.

### Context

- ADR-0016 (TSK-036) scoped the site as "a landing page only (no docs site)" on 2026-10-14. This task changes that scope, so it needs a superseding ADR (ADR-0018; ADR-0017 is reserved by TSK-037).
- Context7 indexes `docs/` (`context7.json`), and the agent skill, `llms.txt` and outreach link to GitHub doc URLs. Moving files out of `docs/` would break those, so the site **renders** the Markdown from `docs/` at build time: copy, not move. `docs/` stays the single source and is reviewed in PRs.

### Content split

**Direction changed on 2026-10-15 (maintainer): the user docs move into `apps/site/src/content/docs/` and are rewritten for the web, instead of being rendered from `docs/`.** See ADR-0018.

Moves to the site (rewritten, with frontmatter title, description, order): `docs/nextjs.md`, `docs/astro.md`, `docs/cli.md`, `docs/config.md`, `docs/comparison.md` as `/docs/<slug>`. Each old file stays in `docs/` as a two-line stub pointing to the site, so links in the published READMEs and posted outreach keep working.

Stays in `docs/`: `output-contract.md` (public API, named in `.claude/rules/architecture.md`), `docs/adr/`, `vision`, `viability`, `requirements`, `open-questions`, `traction`, `release`, `metrics/`, `outreach/`, `samples/`, `posts/` (not for the site), AGENTS.md, CONTRIBUTING.md.

`llms.txt` stays at the repo root with links pointing to the site; the site serves it at `/llms.txt` and generates `/llms-full.txt`.

README after the change: hero, type-error snippet, Why, 3-step get started, short comparison table, Docs section linking to the site, For AI agents, Status, Contributing, License.

### Risks and notes

- GitHub alerts (`> [!TIP]`) need a build-time transform: a small local remark plugin, no new dependency (ADR-0018).
- The package READMEs on npm link to the old docs; changing them changes the tarball, so a changeset is needed.
- Client JS is allowed on the site; only what svgworm generates must not need it. `site:check` must check every new page: every icon from the hashed sprite.
- Use the design system artifact (CLAUDE.local.md) for page styling.

## Acceptance Criteria

- [x] ADR-0018 accepted: supersedes the landing-page-only scope of ADR-0016, decides any Markdown/remark dependency, cites Astro docs — evidence: docs/adr/0018-user-docs-on-the-site-rendered-from-docs.md status accepted by maintainer 2026-10-15; cites Astro docs; no remark dependency (2026-10-14)
- [x] The five consumer docs (nextjs, astro, cli, config, comparison) live in apps/site/src/content/docs/ as a content collection with a zod schema (title, description, order), rewritten for the web, one page each at /docs/<slug>; the build or site:check fails when a doc has no page; GitHub alerts render as asides (tested) — evidence: 5 docs in apps/site/src/content/docs with zod schema; site:check fails on a doc without a page (negative test with a dummy doc); callouts are raw <aside>, no plugin (2026-10-14)
- [x] /llms.txt and a generated /llms-full.txt are served from the site, and llms.txt links point to site URLs — evidence: dist/llms.txt and dist/llms-full.txt built; llms.txt links point to svgworm.com; site:check asserts both and that llms-full holds every doc (2026-10-14)
- [x] Each moved file in docs/ is a two-line stub pointing to the site; context7.json indexes the site docs folder (the stubs stay indexed on purpose: excludeFiles matches bare names and would also hide the site pages, see ADR-0018); README keeps hero, type-error snippet, Why, get started and the short comparison table, and its Docs section links to the site — evidence: docs/{nextjs,astro,cli,config,comparison}.md are one-sentence stubs; README Docs section links to svgworm.com/docs; context7.json indexes apps/site/src/content/docs (stubs not excluded, see ADR) (2026-10-14)
- [x] pnpm site:check passes on every page (icons from the hashed sprite; site client JS allowed); every page has a title, description, canonical URL and sitemap entry — evidence: pnpm site:check exit 0: 7 pages, 19 icons from hashed sprite, 5 docs with title, description, canonical and sitemap entry (2026-10-14)
- [x] Docs made stale are updated: AGENTS.md docs map, .claude/rules/architecture.md, apps/site README, docs/traction.md, package READMEs (with a changeset), skills and the site's own links — evidence: AGENTS.md docs map, apps/site/README.md, package READMEs + .changeset/docs-on-the-site.md updated; docs/traction.md and skills had no stale links; .claude/rules/architecture.md only names output-contract, which stays (2026-10-14)

## Notes

## Learnings

- LRN-036: Astro 7 needs a new package for any Markdown plugin; context7.json excludes match by name
## Progress Log

- [2026-10-14] Created
- [2026-10-14] Started
- [2026-10-14] ADR-0018 drafted (proposed): content collection over docs/ via glob(), local remark plugin for alerts and relative links, no new runtime dependency; sitemap via @astrojs/sitemap pending maintainer approval
- [2026-10-14] ADR-0018 accepted by the maintainer. @astrojs/sitemap 3.7.4 added to apps/site (pinned, approved)
- [2026-10-14] Direction changed by the maintainer: docs move into apps/site/src/content/docs and are rewritten for the web (5 docs; output-contract stays in docs/), stubs left in docs/. ADR-0018 rewritten in place (never committed), criteria 2-6 rewritten. Advisor consulted first.
- [2026-10-14] Implemented: content collection, Base layout, docs pages, llms endpoints, check-output, stubs, README/llms.txt/AGENTS/context7/package READMEs, changeset. Callouts as raw <aside> because Astro 7 (Satteri default) needs a new package for any Markdown plugin; user chose no plugin. Added pnpm override @types/node 22.20.4 so the sitemap dependency does not split vite peers. pnpm verify and pnpm site:check pass.
- [2026-10-14] Review fixes: context7 excludeFolders no longer has bare 'src' (it matched apps/site/src); callout colors and emoji aligned to the design system (tokens only, no emoji); internal links use a trailing slash like canonical and sitemap; post draft relinked to the site; screenshots checked in both themes and at 375px; pnpm verify and pnpm site:check pass.
- [2026-10-15] Criterion 4 reworded: stubs stay indexed in Context7 on purpose (ADR-0018). Fresh evidence at completion: pnpm verify exit 0, pnpm site:check exit 0, PR #7 CI no failures. LRN-036 captured during the task.
- [2026-10-15] Completed