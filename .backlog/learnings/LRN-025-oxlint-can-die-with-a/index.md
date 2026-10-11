---
id: LRN-025
title: oxlint can die with a possible out-of-memory error
status: active
tags: [tooling, oxlint, flaky]
task: TSK-011
created: 2026-10-11
---

## Context
During TSK-011, `oxlint` sometimes ended with "terminated abnormally (possibly out of memory)". It passed on retry and in `pnpm verify`.

## Insight
Looks flaky, not a real lint failure. Not yet reproduced or reported.

## Application
Retry before debugging code. If it recurs, report it upstream to jmlweb/tooling and do not add a local workaround (see AGENTS.md shared tooling rule).
