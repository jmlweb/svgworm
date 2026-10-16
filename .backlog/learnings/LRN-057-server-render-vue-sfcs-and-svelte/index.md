---
id: LRN-057
title: Server-render Vue SFCs and Svelte components in Vitest without bundler plugins
status: active
tags: [testing, vue, svelte, ssr, conformance, vitest]
task: TSK-092
created: 2026-10-16
---

## Context
The conformance tests for the generated Icon.vue and Icon.svelte needed server HTML without adding @vitejs/plugin-vue or @sveltejs/vite-plugin-svelte.

## Insight
Svelte: `compile(source, { generate: 'server' }).js.code`, written to a `.js` file next to the fixture manifest and imported, then `render(Component, { props }).body` from `svelte/server`; Svelte 5 strips type-only TS itself. Vue: `parse` + `compileScript(descriptor, { inlineTemplate: true, templateOptions: { ssr: true } })` gives TS with an inline ssrRender; transpile it with `ts.transpileModule` (`node:module` `stripTypeScriptTypes` is flagged experimental by eslint-plugin-n), then `renderToString(createSSRApp({ render: () => h(Icon, props) }))`. `defineProps` with an imported `IconName` resolves to `type: null` at runtime, which is fine. For type checks, run `vue-tsc` and `svelte-check` through `process.execPath` and the package's bin file, since `.bin` shims are `.cmd` on Windows.

## Application
Reuse this harness in tests/conformance for any new template, and wrap a sync renderer in a promise so a thrown render becomes a rejection like Vue's.
