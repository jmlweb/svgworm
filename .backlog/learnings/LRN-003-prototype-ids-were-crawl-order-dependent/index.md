---
id: LRN-003
title: Prototype ids were crawl-order dependent
status: active
tags: [prototype, naming, determinism]
task: 
created: 2026-10-07
---

main src/sources/ids-generator.ts: path segments -> kebab ids joined with '.', dup names got '-2','-3' suffix in crawl order. Same input could yield different types per machine. Also prefix not sanitized for identifiers (my-app -> My-appIcon). Use collision error + sorted processing (TSK-006).