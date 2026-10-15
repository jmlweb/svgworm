---
id: TSK-022
title: Inline sprite output
status: complete
priority: P3
tags: [post-v0.1]
created: 2026-10-07
source: plan/PLN-001
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Inline sprite output

## Description

Deferred past v0.1. R-13, Q-25, and the inline part of Q-04. Needs Q-05 for per-icon delivery.

## Acceptance Criteria

- [x] Decision on Q-25 recorded in an ADR — evidence: docs/adr/0024-no-inline-sprite-output.md (2026-10-15)
- [x] Style leakage resolved for inline sprites (Q-04) — evidence: Q-04 closed in ADR-0024: no inline mode; sprite has no <style> (ADR-0004) (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-07] Created
- [2026-10-15] Started
- [2026-10-15] ADR-0024 accepted: no inline sprite output. Measured in examples/next-app-router: inlining the 2,182 B sprite grew index.html 13,963 -> 18,895 B (2,920 -> 4,115 B gzip); the symbol markup is sent in HTML and again in the RSC payload. Q-04 inline part closed (sprite has no <style>, ADR-0004). AGENTS.md principle 1 amended (drops 'An inline sprite is opt-in'). Docs: output-contract §4, requirements R-13, open-questions Q-04/Q-05/Q-25, llms.txt, skills, comparison.
- [2026-10-15] Completed