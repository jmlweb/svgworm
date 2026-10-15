---
id: TSK-074
title: Docs: Troubleshooting page
status: pending
priority: P3
tags: [docs, errors, dx]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs: Troubleshooting page

## Description

From the 2026-10-15 docs copy review. The agent skills have an error-code table and fix hints; the site docs have none, so a human hitting an error has nowhere to look. Coordinate wording with TSK-062 (actionable errors) so the page and the CLI hints agree.

## Acceptance Criteria

- [ ] A /docs/troubleshooting/ page covers: icon blank in Safari, sprite 404 (basePath/publicPath, deploys), icon black or wrong color (color overrides), name collision, svgworm check failing in CI
- [ ] It lists every diagnostic code with its meaning and fix, matching the table in the skills
- [ ] Each entry links to the relevant guide or config section
- [ ] llms.txt links to it
- [ ] pnpm site:check passes

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created