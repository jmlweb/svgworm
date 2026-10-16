---
id: LRN-052
title: A bundler plugin must not derive output the CLI cannot reproduce
status: active
tags: [vite, plugin, config, determinism]
task: TSK-091
created: 2026-10-16
---

## Context
The first Vite plugin prototype derived `publicPath` from Vite's `base` when the config set none.

## Insight
In `examples/vite-react`, `vite build --base /app/` committed `/app/icons/...` URLs. Plain `svgworm check` then exited 1, and a manual `svgworm` run rewrote them back to `/icons`. The CLI cannot read `vite.config.*`, so plugin and CLI silently disagreed about the committed output.

## Application
Keep every input that shapes output in `svgworm.config.json`, where the CLI, `check` and the plugin all read it. A plugin may check its bundler's settings against the config and fail loudly (ADR-0033), but never rewrite them.
