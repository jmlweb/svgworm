# 0018. User docs live on the site, in apps/site

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-038
- **Resolves:** none. Supersedes the "landing page only (no docs site)" scope in the Context of [ADR-0016](0016-project-site-astro-on-cloudflare-workers.md). Stack, host, layout and checks of ADR-0016 stay in force, and ADR-0016 itself is not edited.

## Context

[ADR-0016](0016-project-site-astro-on-cloudflare-workers.md) scoped the site as a landing page. Since then the README grew into the docs home, and the docs that people and agents search for (CLI, config, Next.js, Astro, comparison) live only on GitHub, written for GitHub readers. The maintainer decided on 2026-10-15 that the site is the home of the user docs, that those docs move there and are rewritten for the web, and that the README stays short.

Constraints:

- Links to `github.com/jmlweb/svgworm/blob/main/docs/<file>.md` already exist in the published `svgworm@0.1.0` and `@svgworm/react@0.1.0` READMEs on npm, in posted outreach, in `llms.txt`, in the two agent skills and in `context7.json`. Published READMEs cannot be edited.
- `docs/output-contract.md` is the public API reference. [`.claude/rules/architecture.md`](../../.claude/rules/architecture.md) names its path, and about a dozen ADRs link to it. Its readers are adapter authors, not people setting up icons.
- The stack has a dependency budget and an ADR gate for new tools ([decisions rules](../../.claude/rules/decisions.md)).

## Options considered

### Where the user docs live

1. **In `apps/site/src/content/docs/`, rendered by an Astro content collection.** Chosen. The `glob()` loader takes a `base` and a `pattern`, and a zod schema validates each file's frontmatter ([content loader reference](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/content-loader-reference.mdx)). `render()` returns the `<Content />` component and the headings ([`render()`](https://github.com/withastro/docs/blob/main/src/content/docs/en/reference/modules/astro-content.mdx)). The docs are written for the web: site links, frontmatter, no GitHub-only syntax.
2. **Keep them in `docs/` and render them from there.** Rejected by the maintainer: it forces the pages to stay GitHub-shaped and needs a link-rewrite plugin to undo that.
3. **A docs framework (Starlight).** Rejected: a new dependency tree for five pages, and it ships client JS for search and navigation that the pages do not need yet.

### Old links

1. **Leave a two-line stub in each old `docs/<file>.md`** that says the page moved and links to the site. Chosen. Old links keep working, with one click to the new page.
2. **Delete the files.** Rejected: links in published READMEs and posted outreach would 404, and they cannot be fixed.

### Callouts (tips, warnings)

1. **A raw `<aside class="alert alert-tip">` block in the Markdown.** Chosen. No plugin and no dependency. A blank line after the opening tag lets the text inside render as Markdown. The CSS styles `alert-note`, `alert-tip`, `alert-important`, `alert-warning` and `alert-caution`.
2. **GitHub alert syntax (`> [!TIP]`) with a remark plugin.** Rejected: in Astro 7 the default Markdown processor is Sätteri, and `markdown.remarkPlugins` fails until `@astrojs/markdown-remark` is installed (build error checked on 2026-10-15). A plugin for Sätteri needs `@astrojs/markdown-satteri` ([Markdown guide](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/markdown-content.mdx)). Either is a new dependency for about nine callouts, and the docs no longer need GitHub's syntax because they are written for the site.
3. **`@astrojs/mdx` or hand-built `.astro` pages.** Rejected: a new dependency (MDX), or prose inside markup with a second copy of the text for `llms-full.txt` and Context7, which read Markdown.

## Decision

- **Moved to the site** (the five consumer docs), as `apps/site/src/content/docs/<slug>.md`:

  | Old file | Page |
  |---|---|
  | `docs/nextjs.md` | `/docs/nextjs` |
  | `docs/astro.md` | `/docs/astro` |
  | `docs/cli.md` | `/docs/cli` |
  | `docs/config.md` | `/docs/config` |
  | `docs/comparison.md` | `/docs/comparison` |

  They are rewritten for the web, not copied: site-relative links between pages (`/docs/cli`), absolute GitHub URLs for repo files (spikes, ADRs, examples, packages), and frontmatter.
- **Schema:** each file has `title` (string), `description` (string, used for `<meta name="description">`) and `order` (integer, sidebar and `llms-full.txt` order), validated by a zod schema in `apps/site/src/content.config.ts`. A file that fails the schema fails the build.
- **Stays in `docs/`:** `output-contract.md` (public API, named by the architecture rule), ADRs, vision, viability, requirements, open questions, traction, release, metrics, outreach, samples, and `docs/posts/` (blog posts and drafts, not for the site). The site links to `output-contract.md` on GitHub.
- **Callouts:** raw `<aside>` blocks, see above. No Markdown plugin.
- **Stubs:** the five old files in `docs/` become two-line stubs with the site URL.
- **Context7:** `context7.json` adds `apps/site/src/content/docs` to `folders`. `docs` stays in `folders` so `output-contract.md` stays indexed. The five stubs are not excluded: `excludeFiles` matches bare file names, so excluding `cli.md` would also hide the site page of the same name. The stubs are one sentence each; if they hurt retrieval, TSK-031 can rename or filter them. `excludeFolders` had a bare `src`, which also matches `apps/site/src`; it now names `packages/svgworm/src` and `packages/react/src`.
- **`llms.txt`:** the file stays at the repo root (agents and Context7 read it there), with its doc links pointing to the site. The site serves it verbatim as `/llms.txt` and generates `/llms-full.txt` from it plus the full text of the five pages, in `order`.
- **Workspace override:** `pnpm-workspace.yaml` pins `@types/node` to the root's 22.20.4. `@astrojs/sitemap` depends on `sitemap`, which asks for `@types/node` 24, and the second copy split Vite's peer instances and left the vitest configs untyped (`pnpm lint` failed on `no-unsafe-assignment`).
- **Domain:** `https://svgworm.com` (`site` in `astro.config.ts`, `homepage` in both package.json files). Canonical URLs and the sitemap use it.
- **`<head>`:** every page has a title, a description and a canonical URL. The sitemap comes from `@astrojs/sitemap` 3.7.4, the one new dev dependency of `apps/site` (approved by the maintainer on 2026-10-15; published 2026-08-31; its own dependencies are `sitemap` and `zod`).
- **Checks:** the build fails if a doc breaks the schema. `site:check` fails when a file in `src/content/docs/` has no page in `dist/`, when a page lacks a title, a description or a sitemap entry, or when `/llms.txt` or `/llms-full.txt` is missing. The existing check that every manifest icon is used from the hashed sprite now runs over all pages.
- **JS:** docs pages ship no client JS for now. Search or copy buttons can be added later, the site rule allows client JS.
- **README and package READMEs:** the root README keeps hero, the type-error snippet, Why, three-step get started and the short comparison table, and its Docs section links to the site. `packages/svgworm/README.md` and `packages/react/README.md` link to the site too, which changes the npm tarball, so it needs a changeset.

## Evidence

- Astro docs (Context7, `/withastro/docs`): `glob()` loader with `base` and `pattern`, content collection schemas, `render()` returning `<Content />` and `headings`, linked above.
- Blast radius, `grep` over the repo on 2026-10-15: links to the six docs appear in README, both package READMEs, `llms.txt`, AGENTS.md, `.claude/rules/architecture.md`, the site's `Landing.astro`, ADR 0007, 0010, 0012, 0014, 0016 and 0017, and the outreach docs. Accepted ADRs are not edited; their relative links land on the stubs.
- `https://svgworm.com` and `https://svgworm.jmlweb.workers.dev` both answer 200 (checked 2026-10-15).

## Consequences

- The site is now the docs home, and the PR preview shows doc changes.
- Docs live in two places by design: five rewritten pages on the site, and the contract and internals in `docs/`. A reader of the repo finds stubs that point to the site.
- Docs made stale by this ADR are updated in the same task: root and package READMEs, `llms.txt`, `context7.json`, the agent skills, AGENTS.md docs map, `.claude/rules/architecture.md`, `apps/site/README.md`, `docs/traction.md` and the site's own links.
- ADR-0016's Context sentence about "no docs site" is superseded; the rest of ADR-0016 is unchanged.
