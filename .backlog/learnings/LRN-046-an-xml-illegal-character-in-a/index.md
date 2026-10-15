---
id: LRN-046
title: An XML-illegal character in a spike payload makes DOMParser reject the whole sprite
status: active
tags: [security, svg, spike, testing]
task: TSK-067
created: 2026-10-15
---

## Context
The TSK-067 security payloads used `&#1;javascript:` in an attribute.
## Insight
`&#1;` is not allowed in XML 1.0, so DOMParser returned a parsererror and the loader injected nothing. The case "passed" without testing the sanitizer at all.
## Application
Hostile-payload tests must assert that the hostile document was actually injected (or parsed) before asserting that nothing ran; use XML-legal obfuscation (`&#9;`, `&#10;`).
