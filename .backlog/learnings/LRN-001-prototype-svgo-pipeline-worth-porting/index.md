---
id: LRN-001
title: Prototype svgo pipeline worth porting as idea
status: active
tags: [svgo, optimization, prototype]
task: 
created: 2026-10-07
---

main branch src/icon/icon-formatter.ts used svgo multipass with: preset-default, removeDimensions, reusePaths, removeXMLNS, removeXlink, sortAttrs, sortDefsChildren, prefixIds (prefix '<id>_' with dots replaced by dashes), convertColors{currentColor}, addAttributesToSVGElement{id}. prefixIds per icon is essential to avoid internal id collisions in a shared sprite. Global currentColor + root fill=currentColor broke stroke icons — must be per-icon (TSK-003).