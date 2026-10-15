---
id: TSK-048
title: Site layout polish: code wrapping, docs table, mobile hero
status: complete
priority: P3
tags: [site, design, mobile]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Site layout polish: code wrapping, docs table, mobile hero

## Description

From the 2026-10-15 site review (Playwright screenshots at 1440px and 390px).

- Mobile: the agents terminal splits `--skill` into `--` / `skill`, inline `--json` splits the same way, `emoji/mushroom` breaks as `mushroo` / `m`, and the `Cache-Control: immutable` pill wraps.
- Desktop: the "Rendered on the server" tile orphans `</svg>`, and step 3 orphans `/>`.
- The `/docs/nextjs/` file table is clipped ("when an icon needs i…").
- The install line is about 12px mono, and it is the main conversion element.
- The docs sidebar entry "Next" is ambiguous next to "Next.js".
- "Star on GitHub" uses the `git-branch` icon.
- The mobile page is about 7,500px tall, and the hero terminal pushes the proof section far down. The stats band carries the same message.

## Acceptance Criteria

- [x] Inline code never breaks inside a token (--json, --skill, emoji/mushroom, Cache-Control: immutable) at 390px — evidence: .landing :not(pre) > code { white-space: nowrap }; showcase names wrap only at a <wbr> after the slash; Playwright 390px screenshots of .agents and .showcase-multi: --json, --skill and emoji/mushroom intact, scrollWidth 390 (2026-10-15)
- [x] Terminal and code pre blocks scroll horizontally instead of wrapping, with no orphaned </svg> or /> lines at 1440px — evidence: .terminal pre, .code { white-space: pre; overflow-x: auto }; 1440px screenshots of .bento and .steps: no orphaned </svg> or />; the two samples were shortened so they fit without scrolling (2026-10-15)
- [x] The file table on /docs/nextjs/ is fully readable at 1440px — evidence: nextjs.md file list is now a markdown table; Playwright at 1440px: no clipped pre or table on /docs/nextjs/ (2026-10-15)
- [x] The install line is at least 14px — evidence: the 12px override at 560px is gone; .install stays 14px (hero screenshot at 390px, the line scrolls inside) (2026-10-15)
- [x] The docs sidebar label Next reads Next steps — evidence: nextjs.md and astro.md headings renamed to Next steps (sidebar TOC label) (2026-10-15)
- [x] Star on GitHub uses a star icon from the sprite — evidence: apps/site/icons/star.svg (Lucide, ISC) added; both Star on GitHub buttons use <Icon name=star />; site sprite and manifest regenerated (2026-10-15)
- [x] The hero terminal is hidden or condensed below 640px — evidence: .hero .terminal { display: none } below 640px; page height at 390px 7555 → 7169; the stats band keeps the numbers (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Docs critique fixes: the /docs/nextjs/ file list is now a table and the scripts JSON spans several lines, so nothing clips at 1440px. The sidebar label Next is still open.
- [2026-10-15] Started
- [2026-10-15] pnpm site:check passed (22 icons); site vitest 13 passed.
- [2026-10-15] Completed