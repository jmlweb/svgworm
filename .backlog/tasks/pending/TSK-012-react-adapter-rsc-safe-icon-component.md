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

R-40..R-44, plus React side of inline sprite (R-13). Hook-free Icon typed against generated names, resolves sprite URL from generated manifest module, accessible defaults. Verify in Next.js App Router server component with zero client JS.

## Acceptance Criteria

- [ ] Invalid name is a type error (type test)
- [ ] Renders in RSC without use client
- [ ] Zero client JS verified in example app
- [ ] Multiple sprites work transparently
- [ ] Inline sprite usable from React when enabled (R-13)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created