---
id: LRN-036
title: Astro 7 needs a new package for any Markdown plugin; context7.json excludes match by name
status: active
tags: [astro, markdown, dependencies, context7, site]
task: TSK-038
created: 2026-10-14
---

## Context

TSK-038 moved the user docs into apps/site as an Astro content collection. The plan was a small local remark plugin for GitHub-style alerts, on the assumption that it needed no dependency (ADR-0018 first draft).

## Insight

Astro 7's default Markdown processor is Sätteri. `markdown.remarkPlugins` in `astro.config.ts` fails the build ("run on the `unified` processor from `@astrojs/markdown-remark`, which is no longer installed by default"). A Sätteri plugin needs `@astrojs/markdown-satteri` instead. Either way a Markdown plugin is a new dependency, so "a local plugin, no dependency" is false on Astro 7.

Related, in `context7.json`: `excludeFiles` matches bare file names, not paths, so excluding `cli.md` would also hide a same-named file elsewhere. A bare entry like `"src"` in `excludeFolders` matches nested folders, so it would also exclude `apps/site/src/content/docs`.

## Application

- Before planning any Markdown transform on the site, check the Astro 7 markdown docs and decide the dependency in the ADR. For callouts, a raw `<aside class="alert alert-tip">` block in the Markdown needs no plugin.
- When changing `context7.json`, name exact folder paths in `excludeFolders` and do not rely on `excludeFiles` to tell two same-named files apart.
