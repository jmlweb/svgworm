---
id: LRN-050
title: Vite's closeServer plugin hook first ships in 8.3.0
status: active
tags: [vite, plugin, tooling]
task: TSK-091
created: 2026-10-16
---

## Context
The svgworm/vite plugin must stop its file watcher when `vite dev` closes, including in middleware mode.

## Insight
`closeServer` is absent from the published 8.0.0, 8.1.0 and 8.2.0 type definitions and first appears in 8.3.0. Before it, cleanup had to hang off `server.httpServer`, which is `null` in middleware mode.

## Application
Keep the `vite` peer floor at `^8.3.0` while the plugin uses `closeServer`. Check a hook against the published `.d.ts` of each minor before lowering a peer range.
