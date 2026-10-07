---
id: TSK-012
title: React adapter: RSC-safe Icon component
status: pending
priority: P2
tags: [adapter, react]
created: 2026-10-07
source: manual
depends-on: [TSK-011]
---

# React adapter: RSC-safe Icon component

## Description

R-40..R-44. Inline sprite (R-13) is out of v0.1, so there is no inline React path. The sprite URL is resolved from the manifest, so multiple sprites work later without changing the component. Hook-free Icon typed against generated names, resolves sprite URL from generated manifest module, accessible defaults. Verify in Next.js App Router server component with zero client JS.

## Acceptance Criteria

- [ ] Invalid name is a type error (type test)
- [ ] Renders in RSC without use client
- [ ] Zero client JS verified in example app
- [ ] Sprite URL resolved from the manifest (multi-sprite-ready; multi-sprite itself is post-v0.1)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created