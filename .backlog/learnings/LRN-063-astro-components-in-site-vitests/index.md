---
id: LRN-063
title: Astro components in site vitests must be imported dynamically for type-aware lint
status: active
tags: [site, testing, astro]
task: TSK-104
created: 2026-11-03
---

In apps/site vitest tests, type-aware oxlint flags a static import of an .astro component (no-unsafe-argument: error typed) when passed to AstroContainer.renderToString. Import it dynamically and cast to { default: Parameters<AstroContainer['renderToString']>[0] }, as icon-conformance.test.ts does. Also: the site's Playwright browsers in ~/.cache/ms-playwright may be a newer revision than the workspace playwright package expects; pass executablePath to the installed chrome-headless-shell for ad-hoc screenshots.
