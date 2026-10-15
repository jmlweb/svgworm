---
id: TSK-058
title: Docs + init: client components, Vite/plain React, framework-neutral wording
status: complete
priority: P2
tags: [docs, react, vite, init, zero-js]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Docs + init: client components, Vite/plain React, framework-neutral wording

## Description

Dogfooding 0.2.1: in Next, a `'use client'` component pulls the manifest into a client chunk; in Vite 8 + React, `dist/assets/*.js` contains every icon's metadata (lucide's icons.js is ~337 KB). Nothing documents this, while the docs promise zero client JS. On Vite, init says "Import { Icon } in a Server Component" and the TTY prompt mentions "the Next basePath". With Vite `base: '/app/'` the sprite 404s until `--public-path /app/icons` is passed. Related: TSK-024 (Vite recipe).

## Acceptance Criteria

- [x] Docs state that using Icon in a use client component or a client-only app (Vite) ships the whole manifest (icons.js) in the client bundle, with its size order and how to avoid it — evidence: nextjs.md Client components section (manifest in the client chunk, ~200 B per icon, 1,500 icons ≈ 300 KB, render on the server and pass down); packages/react/README.md; llms.txt step 4; svgworm-nextjs skill fact (2026-10-15)
- [x] init and its next steps say Server Component and Next basePath only when next is a dependency; Vite/plain React gets neutral wording — evidence: done in TSK-060: plan.ts says Server Component only when next is a dependency (plan.test.ts says Server Component only when next is a dependency → pass) (2026-10-15)
- [x] The interactive public-path prompt does not mention Next basePath for non-Next projects — evidence: done in TSK-060: prompts.ts mentions the Next basePath only with facts.usesNext, the Astro base with usesAstro (2026-10-15)
- [x] Vite base to --public-path mapping is documented (coordinate with TSK-024) — evidence: packages/react/README.md Client-only apps and Vite: base /app/ → --public-path /app/icons; llms.txt step 4; nextjs.md links to it (2026-10-15)
- [x] @svgworm/react README covers client usage — evidence: packages/react/README.md: Client components and Client-only apps and Vite sections (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] Docs only, no changeset. pnpm site:check passed.
- [2026-10-15] Completed