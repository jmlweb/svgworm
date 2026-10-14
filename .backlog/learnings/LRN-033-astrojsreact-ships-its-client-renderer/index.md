---
id: LRN-033
title: @astrojs/react ships its client renderer even when nothing hydrates
status: active
tags: [astro, react, static-site, bundle]
task: TSK-036
created: 2026-10-14
---

Context: a static Astro page rendered with @astrojs/react and no client: directive.
Insight: Astro's build always adds each renderer's clientEntrypoint to the client inputs (astro/dist/core/build/static-build.js, getClientInput). The result was an unreferenced ~220 KB React runtime in dist/_astro, though the HTML had no <script>.
Application: for zero-JS pages, drop @astrojs/react and render the components with react-dom/server (renderToStaticMarkup) inside the .astro file, then output the markup with set:html. Confirm with a dist/ listing: no _astro/*.js file.
