---
id: TSK-038
title: Docs on the website: render user docs from docs/, slim the README
status: pending
priority: P2
tags: [docs, site, discoverability]
created: 2026-10-14
source: manual
depends-on: []
---

# Docs on the website: render user docs from docs/, slim the README

## Description

### Goal

Make https://svgworm.jmlweb.workers.dev the home of the user docs, and keep the repo README short and meaningful for humans while staying useful to agents.

### Context

- ADR-0016 (TSK-036) scoped the site as "a landing page only (no docs site)" on 2026-10-14. This task changes that scope, so it needs a superseding ADR (ADR-0018; ADR-0017 is reserved by TSK-037).
- Context7 indexes `docs/` (`context7.json`), and the agent skill, `llms.txt` and outreach link to GitHub doc URLs. Moving files out of `docs/` would break those, so the site **renders** the Markdown from `docs/` at build time: copy, not move. `docs/` stays the single source and is reviewed in PRs.

### Content split

To the site (rendered from `docs/`):

| Repo doc | Site page | Why |
|---|---|---|
| `docs/nextjs.md` | `/docs/nextjs` | Main onboarding path |
| `docs/cli.md`, `docs/config.md` | `/docs/cli`, `/docs/config` | Searchable reference |
| `docs/comparison.md` | `/compare` | Lands from search and outreach |
| `docs/posts/per-icon-color.md` | `/blog/per-icon-color` | Strongest story, no home besides LinkedIn |
| `docs/output-contract.md` | `/docs/output-contract` | Reference for adapter authors; repo stays source of truth (public API) |
| `llms.txt` | `/llms.txt` + generated `/llms-full.txt` | Agents look at the domain root |
| `docs/astro.md` (TSK-037) | `/docs/astro` | Same treatment once it exists |

Repo-only (contributor or internal): `docs/adr/`, `vision`, `viability`, `requirements`, `open-questions`, `traction`, `release`, `metrics/`, `outreach/`, `samples/`, AGENTS.md, CONTRIBUTING.md.

README after the change: hero, type-error snippet, Why, 3-step get started, short comparison table, Docs section linking to the site, For AI agents, Status, Contributing, License.

### Risks and notes

- GitHub alerts (`> [!TIP]`) and relative `.md` links need a build-time transform. A remark plugin would be a new dev dependency of `apps/site`: decide in ADR-0018 and ask the maintainer before adding it.
- `site:check` must keep zero client JS on every page and check every new page, not just the landing page.
- Coordinate with TSK-037: it ports `landing.tsx` to `.astro` and adds `docs/astro.md`. Whichever lands second adapts.
- Use the design system artifact (CLAUDE.local.md) for page styling.

## Acceptance Criteria

- [ ] ADR-0018 accepted: supersedes the landing-page-only scope of ADR-0016, decides any Markdown/remark dependency, cites Astro docs
- [ ] The site builds one page per user doc from docs/*.md (nextjs, cli, config, comparison, output-contract, posts/per-icon-color), with a check that fails when a listed doc has no page; GitHub alerts and relative .md links render correctly
- [ ] /llms.txt and a generated /llms-full.txt are served from the site, and llms.txt links point to site URLs
- [ ] README keeps hero, type-error snippet, Why, get started and the short comparison table; its Docs section links to the site; repo docs/ files stay the single source and lose no content
- [ ] pnpm site:check passes with zero client JS on every page; every page has a title, description and sitemap entry
- [ ] Docs made stale are updated: AGENTS.md docs map, apps/site README, docs/traction.md, skill and context7.json links where needed

## Notes

## Learnings

## Progress Log

- [2026-10-14] Created