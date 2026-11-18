---
id: LRN-068
title: Local gate noise: Next 16.4.0 SecurityFatalError on first build, Vue conformance fails on Node 25
status: active
tags: [testing, ci, examples]
task: TSK-109
created: 2026-11-15
---

On a fresh machine the first `pnpm example:check` stops in `next build` with `SecurityFatalError` (an upgrade nag for Next 16.4.0); rerunning the same command passes. Under local Node 25.8, `tests/conformance` fails 3 Vue tests ("promise resolved '' instead of rejecting") on a clean `main` too, while CI's Node 22/24/26 matrix is green. Neither comes from the change under test; confirm with `git stash` on main before chasing it.
