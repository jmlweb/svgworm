---
id: TSK-058
title: Docs + init: client components, Vite/plain React, framework-neutral wording
status: pending
priority: P2
tags: [docs, react, vite, init, zero-js]
created: 2026-10-15
source: manual
depends-on: []
---

# Docs + init: client components, Vite/plain React, framework-neutral wording

## Description

Dogfooding 0.2.1: in Next, a `'use client'` component pulls the manifest into a client chunk; in Vite 8 + React, `dist/assets/*.js` contains every icon's metadata (lucide's icons.js is ~337 KB). Nothing documents this, while the docs promise zero client JS. On Vite, init says "Import { Icon } in a Server Component" and the TTY prompt mentions "the Next basePath". With Vite `base: '/app/'` the sprite 404s until `--public-path /app/icons` is passed. Related: TSK-024 (Vite recipe).

## Acceptance Criteria

- [ ] Docs state that using Icon in a use client component or a client-only app (Vite) ships the whole manifest (icons.js) in the client bundle, with its size order and how to avoid it
- [ ] init and its next steps say Server Component and Next basePath only when next is a dependency; Vite/plain React gets neutral wording
- [ ] The interactive public-path prompt does not mention Next basePath for non-Next projects
- [ ] Vite base to --public-path mapping is documented (coordinate with TSK-024)
- [ ] @svgworm/react README covers client usage

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created