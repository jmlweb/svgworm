---
id: LRN-069
title: Vitest test.env cannot pin a dependency's development or production build
status: active
tags: [testing, vitest, vue, conformance]
task: TSK-103
created: 2026-11-18
---

Vue chooses its build in two places. `vue` reads NODE_ENV when its CJS index loads. `@vue/server-renderer` resolves through the Node export conditions `production` and `development`. Vitest 5 passes a `--conditions` flag to workers. It derives the flag from the main process's NODE_ENV (Vite `isProduction`), whatever the project's `test.env` says. Vite also merges `ssr.resolve.conditions` with its defaults, so a project cannot remove `development|production` either.

What works for forcing production in one project: `test.env: { NODE_ENV: 'production' }` plus `test.execArgv: ['--conditions', 'production']`. Node picks the first matching export key, and Vue lists `production` before `development`. Forcing development under a NODE_ENV=production shell is not possible this way, so the default conformance project follows the shell. Its tests branch on `process.env.NODE_ENV`.

Two projects that run the same test file in parallel need separate scratch dirs (mkdtemp). This replaces LRN-064's `env -u NODE_ENV` workaround: the suite now passes in both modes. Vue 3.5 apps can set `app.config.throwUnhandledErrorInProduction` to get the throw back.
