---
id: TSK-016
title: examples/next-app-router: Next 16 Turbopack example
status: complete
priority: P2
tags: [example, v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: [TSK-012]
started: 2026-10-12
completed: 2026-10-12
---

# examples/next-app-router: Next 16 Turbopack example

## Description

Next 16, Turbopack, Server Components. Includes an automated check that no icon code reaches client chunks. Reuses the TSK-007 method (PLN-001 step 12).

## Acceptance Criteria

- [x] Example builds with Turbopack in CI
- [x] Automated check: no icon code in client chunks
- [x] Zero client JS for icons verified

## Notes

## Learnings

- LRN-028: Turbopack resolves imports by file extension, not by TypeScript's .js-to-.ts mapping
- LRN-029: svgworm check must run before the build in CI, or it proves nothing
## Progress Log

- [2026-10-07] Created
- [2026-10-12] Started
- [2026-10-12] Added examples/next-app-router (Next 16.4.0, Turbopack, React 19.3.0) as a workspace package. Commit 1129608.
- [2026-10-12] Server Component Icon via createIcon(manifest); page renders every manifest icon plus size, color, title and label cases; next.config.ts ships the immutable headers() rule. Icons are repo fixtures (fixtures/LICENSES.md).
- [2026-10-12] scripts/check-client-chunks.mjs scans .next/static for the adapter name, sprite URLs and symbol ids, and asserts the prerendered HTML has every <use href> and stack reference. Negative control verified: a 'use client' component importing the manifest fails the check.
- [2026-10-12] CI job "example" runs pnpm example:check: svgworm check against the committed output, next build, then the chunk check. Root `pnpm build` now filters to packages/* so matrix jobs do not build Next.
- [2026-10-12] Completed