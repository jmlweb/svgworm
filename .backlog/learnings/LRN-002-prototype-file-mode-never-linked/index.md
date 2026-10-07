---
id: LRN-002
title: Prototype file mode never linked sprite URL to Icon
status: active
tags: [prototype, delivery, manifest]
task: 
created: 2026-10-07
---

main wrote sprite.<md5>.svg and deleted other sprite.*.svg via glob, but generated Icon used href='#id' (inline only). Root cause: no manifest. Any external-sprite design needs a generated module/manifest exposing hashed URL (TSK-004).