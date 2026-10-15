---
id: TSK-072
title: Docs: heading anchor links
status: complete
priority: P4
tags: [site, docs, ux]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: heading anchor links

## Description

From the 2026-10-15 docs design critique. Docs headings have ids but no visible link, so sharing a deep link means using the sidebar. Astro's heading ids may be added after user rehype plugins run; check the order before choosing an approach.

## Acceptance Criteria

- [x] Each h2 and h3 shows a # link on hover and focus — evidence: [slug].astro adds <a class=heading-anchor href=#id> to every h2 and h3 of the rendered HTML; CSS shows it on heading hover and on focus-visible (12 anchors on /docs/cli/) (2026-10-15)
- [x] The link has an accessible name — evidence: aria-label Link to this section (2026-10-15)
- [x] Heading ids do not change — evidence: ids come from the HTML Astro rendered (entry.rendered.html); Playwright: the first six ids match the TOC slugs and every TOC link resolves (2026-10-15)
- [x] No new dependency unless the maintainer approves one (try a local rehype plugin first) — evidence: no new dependency: a regex over the rendered HTML in [slug].astro instead of a rehype plugin, because Astro assigns ids after user plugins (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Decision: post-process entry.rendered.html rather than a rehype plugin; @astrojs/markdown-remark is not resolvable from apps/site under pnpm and a plugin would need its own slugger. pnpm site:check and astro check pass.
- [2026-10-15] Completed