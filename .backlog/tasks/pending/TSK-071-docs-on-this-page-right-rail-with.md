---
id: TSK-071
title: Docs: on-this-page right rail with scroll-spy
status: pending
priority: P4
tags: [site, docs, design]
created: 2026-10-15
source: manual
depends-on: [TSK-068]
---

# Docs: on-this-page right rail with scroll-spy

## Description

From the 2026-10-15 docs design critique. At 1440px about 250px right of the content column is unused, while the current page's sections are nested under it in the left sidebar, making it long. Move the sections to a right rail and highlight the section in view. Depends on the mobile nav task because both change `DocsNav.astro`.

## Acceptance Criteria

- [ ] At >=1200px the section list sits in a right rail and the left nav lists pages only
- [ ] The current section is highlighted while scrolling (JS on docs pages only)
- [ ] Without JS the rail is a plain list of links
- [ ] Below 1200px the layout stays as it is now

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created