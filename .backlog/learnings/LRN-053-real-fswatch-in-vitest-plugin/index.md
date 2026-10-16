---
id: LRN-053
title: Real fs.watch in Vitest plugin tests aborted the macOS CI runner
status: active
tags: [testing, ci, macos, watch, vite]
task: TSK-091
created: 2026-10-16
---

## Context
The first PR run of the Vite plugin tests used real `fs.watch` on temp folders that `afterEach` removed.

## Insight
On macOS CI, `pnpm test` aborted with exit 134 right after `plugin.test.ts`; it never reproduced locally. The suspected cause is FSEvents teardown racing the temp-folder removal. Injecting a fake watcher factory (`createWatcher`) made all 23 checks pass on every OS.

## Application
Tests of a shell over `watch()` should inject a fake watcher and fire changes by hand. Leave real `fs.watch` timing to the core watch tests.
