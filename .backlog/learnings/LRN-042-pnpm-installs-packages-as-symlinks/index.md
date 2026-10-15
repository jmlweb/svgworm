---
id: LRN-042
title: pnpm installs packages as symlinks: stat the source root, lstat only inside
status: active
tags: [pnpm, symlink, discover, sources, node_modules]
task: TSK-059
created: 2026-10-15
---

## Context
TSK-059 let `sources` point into `node_modules` (`{ "dir": "node_modules/lucide-static/icons", "include": [...] }`). Discovery used `lstat` on the source folder and refused anything that was not a directory.

## Insight
In a pnpm project `node_modules/<pkg>` is a symlink into `.pnpm/`, so `lstat(dir).isDirectory()` is false and the build said "source folder not found" for every package source. npm and Yarn lay packages out as real folders, so the bug only shows under pnpm.

## Application
Resolve the source root with `stat` (follow the link) and keep `lstat` for entries inside it, so symlinked files and folders inside a source are still skipped (ADR-0007). A unit test symlinks a folder and reads through it.
