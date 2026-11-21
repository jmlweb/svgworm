---
id: LRN-070
title: Config paths resolve against cwd, not the config file; schema:generate output needs oxfmt
status: active
tags: [config, paths, docs, schema]
task: TSK-110
created: 2026-11-21
---

Relative sources, outDir and moduleDir resolve against cwd (CLI) or the Vite root, never the config file folder, even with --config sub/x.json. ADR-0029, llms.txt and config.md already said so; only the zod descriptions said "relative to the config". Also: pnpm schema:generate output is not oxfmt-formatted; run oxfmt on svgworm.schema.json afterwards or format:check fails.
