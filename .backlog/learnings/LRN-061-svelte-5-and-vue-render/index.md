---
id: LRN-061
title: Svelte 5 and Vue render functions run a <script> on client-only mounts
status: active
tags: [svelte, vue, cross-origin, init]
task: TSK-099
created: 2026-10-31
---

Svelte 5 (5.57) runs a <script> written in markup, <svelte:head> included, after a client-only mount: run_scripts in svelte/src/internal/client/dom/template.js replaces script elements from a cloned template with fresh ones, and skips that while hydrating because the server-rendered tag already ran. Vue templates still refuse <script>, but a render function h('script', {...}) renders it on the server and inserts a running element on the client. Both frameworks set every attribute before inserting the element, so integrity is in place before src loads; a spike control with src written first still passed 18/18. Evidence: spikes/TSK-099-vue-svelte-inject-loader, ADR-0036.
