---
id: LRN-014
title: Modern Node built-ins replace most CLI dependencies
status: active
tags: [tooling, dependencies, cli]
task: TSK-009
created: 2026-10-07
---

## Context
Dependency budget for the CLI (ADR-0008).
## Insight
On Node >= 22.20, `parseArgs`, `styleText`, `fs.glob`, `path.matchesGlob`, recursive `fs.watch` and `crypto` are stable. They replace commander, picocolors/chalk, tinyglobby, picomatch and chokidar.
## Application
Check `node:` built-ins and their docs history tables before adding any dependency. The engines floor follows from the newest API that became stable.
