---
id: TSK-048
title: Site layout polish: code wrapping, docs table, mobile hero
status: pending
priority: P3
tags: [site, design, mobile]
created: 2026-10-15
source: manual
depends-on: []
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

- [ ] Inline code never breaks inside a token (--json, --skill, emoji/mushroom, Cache-Control: immutable) at 390px
- [ ] Terminal and code pre blocks scroll horizontally instead of wrapping, with no orphaned </svg> or /> lines at 1440px
- [ ] The file table on /docs/nextjs/ is fully readable at 1440px
- [ ] The install line is at least 14px
- [ ] The docs sidebar label Next reads Next steps
- [ ] Star on GitHub uses a star icon from the sprite
- [ ] The hero terminal is hidden or condensed below 640px

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created