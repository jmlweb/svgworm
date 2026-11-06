---
id: LRN-064
title: NODE_ENV=production makes the Vue conformance throw tests fail locally
status: active
tags: [testing, conformance, vue]
task: TSK-100
created: 2026-11-06
---

With NODE_ENV=production set in the shell, three icon-conformance tests fail, on a clean main too: Icon.vue rendered with vue/server-renderer resolves to an empty string instead of rejecting on an unknown icon name or a missing stack file. With `env -u NODE_ENV` all of them pass, and CI (which does not set NODE_ENV) is green. Run the conformance suite and pnpm verify with `env -u NODE_ENV` before treating such a failure as a regression.
