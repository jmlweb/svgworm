---
id: LRN-056
title: SvelteKit serves static/, not public/: sprite outDir must follow
status: active
tags: [sveltekit, svelte, init, outdir, public-path]
task: TSK-092
created: 2026-10-16
---

## Context
svgworm's default `outDir` is `public/icons` (ADR-0010), which Next.js, Vite, Astro and Nuxt serve as is.

## Insight
SvelteKit's static folder is `static/`. Sprites written to `public/icons` 404 there. `init` therefore writes `"outDir": "static/icons"` with `"publicPath": "/icons"` for SvelteKit when no `--out-dir` is given (`withFrameworkDefaults` in plan.ts), and the prompt's custom-publicPath branch reuses that default. SvelteKit `paths.base` and Nuxt `app.baseURL` must be included in `publicPath`, like Next `basePath`.

## Application
When adding a framework, check which folder it serves untouched before trusting the `public/icons` default, and give `init` a per-framework default instead of documenting a manual fix.
