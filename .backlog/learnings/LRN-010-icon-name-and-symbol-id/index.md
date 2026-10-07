---
id: LRN-010
title: Icon name and symbol id must be different strings
status: active
tags: [naming, output-contract, svg]
task: TSK-006
created: 2026-10-07
---

## Context
TSK-006 proposed lowercase kebab ids with a `/` separator.
## Insight
`/` is not allowed in an XML Name/NCName, and non-ASCII fragments get percent-encoded, so one string can't be both a readable TS literal and a safe `<symbol id>`/`#fragment`. Fix: injective ASCII encoding (`i-` prefix, `/` to `--`, other chars `_hex_`).
## Application
Adapters always read the symbol id from the manifest and never derive it from the public name.
