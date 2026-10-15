---
id: TSK-074
title: Docs: Troubleshooting page
status: complete
priority: P3
tags: [docs, errors, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs: Troubleshooting page

## Description

From the 2026-10-15 docs copy review. The agent skills have an error-code table and fix hints; the site docs have none, so a human hitting an error has nowhere to look. Coordinate wording with TSK-062 (actionable errors) so the page and the CLI hints agree.

## Acceptance Criteria

- [x] A /docs/troubleshooting/ page covers: icon blank in Safari, sprite 404 (basePath/publicPath, deploys), icon black or wrong color (color overrides), name collision, svgworm check failing in CI — evidence: troubleshooting.md sections: An icon is blank in Safari, The sprite 404s, An icon is black or the wrong color, Name collision, svgworm check fails in CI (2026-10-15)
- [x] It lists every diagnostic code with its meaning and fix, matching the table in the skills — evidence: Diagnostic codes table lists every DiagnosticCode from core/errors.ts plus cli/usage and cli/unexpected, kind and fix; the skills link to it (2026-10-15)
- [x] Each entry links to the relevant guide or config section — evidence: each section links to the config, icon, how-it-works, nextjs or astro section it refers to (2026-10-15)
- [x] llms.txt links to it — evidence: llms.txt Docs list links /docs/troubleshooting/ (2026-10-15)
- [x] pnpm site:check passes — evidence: pnpm site:check passed (8 docs) (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset. Wording matches the TSK-062 CLI hints (collision fix text quoted).
- [2026-10-15] Completed