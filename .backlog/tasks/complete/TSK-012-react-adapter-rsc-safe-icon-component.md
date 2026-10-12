---
id: TSK-012
title: React adapter: RSC-safe Icon component
status: complete
priority: P2
tags: [adapter, react]
created: 2026-10-07
source: manual
depends-on: [TSK-011]
started: 2026-10-11
completed: 2026-10-12
---

# React adapter: RSC-safe Icon component

## Description

R-40..R-44. Inline sprite (R-13) is out of v0.1, so there is no inline React path. The sprite URL is resolved from the manifest, so multiple sprites work later without changing the component. Hook-free Icon typed against generated names, resolves sprite URL from generated manifest module, accessible defaults. Verify in Next.js App Router server component with zero client JS.

## Acceptance Criteria

- [x] Invalid name is a type error (type test)
- [x] Renders in RSC without use client
- [x] Zero client JS verified in example app
- [x] Sprite URL resolved from the manifest (multi-sprite-ready; multi-sprite itself is post-v0.1)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-11] Started
- [2026-10-11] Added createIcon(manifest) in packages/react (commit 46ca9d8): hook-free, typed against manifest keys, renders use/img/mask by delivery, fails loudly (SvgwormReactError).
- [2026-10-11] Dev deps added with approval: react, react-dom, @types/react, @types/react-dom (all 19.3.0, exact). Runtime deps unchanged.
- [2026-10-11] Criteria 1, 2, 4 met: type test, react-dom/server render tests plus no-hooks/no-use-client source check, URL and id read from manifest.
- [2026-10-11] Criterion 3 (zero client JS in an example app) open: needs the Next example from TSK-016.
- [2026-10-12] Criterion 3 met by TSK-016: examples/next-app-router builds with Turbopack and scripts/check-client-chunks.mjs proves no icon code reaches client chunks (commit 1129608).
- [2026-10-12] Completed