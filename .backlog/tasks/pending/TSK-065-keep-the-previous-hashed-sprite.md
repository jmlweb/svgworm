---
id: TSK-065
title: Keep the previous hashed sprite to avoid 404s across deploys
status: pending
priority: P4
tags: [output, deploy, caching]
created: 2026-10-15
source: manual
depends-on: []
---

# Keep the previous hashed sprite to avoid 404s across deploys

## Description

Dogfooding 0.2.1: each rebuild deletes the old hashed sprite. A page from the previous deploy still cached in a browser or CDN points at a sprite that no longer exists. Only some hosts keep old deploy assets.

## Acceptance Criteria

- [ ] Decide (ADR or doc) whether a build keeps the previous hashed sprite or documents the deploy-skew risk
- [ ] If kept, pruning stays deterministic and check is not affected

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created