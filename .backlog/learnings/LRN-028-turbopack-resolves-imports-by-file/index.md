---
id: LRN-028
title: Turbopack resolves imports by file extension, not by TypeScript's .js-to-.ts mapping
status: active
tags: [nextjs, turbopack, typescript, example]
task: TSK-016
created: 2026-10-12
---

## Context
examples/next-app-router imported `../components/icon.js` (the repo style: `.ts` sources import `.js`, rewritten by `rewriteRelativeImportExtensions`). `next build` with Turbopack failed: "Module not found: Can't resolve '../components/icon.js'".
## Insight
Turbopack (and webpack) resolve the literal specifier. A `.js` specifier only works when a `.js` file exists (the generated `svgworm/icons.js` is fine). TypeScript's `.js` to `.tsx` mapping is a type-checker convenience, not a bundler rule.
## Application
In app code bundled by Next, import TS/TSX modules without an extension. Keep `.js` only for real JavaScript files such as the generated manifest module. The `svgworm init` wiring imports `../svgworm/icons.js`, which is a real file, so it is safe.
