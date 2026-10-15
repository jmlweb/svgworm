---
id: TSK-065
title: Keep the previous hashed sprite to avoid 404s across deploys
status: complete
priority: P4
tags: [output, deploy, caching]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Keep the previous hashed sprite to avoid 404s across deploys

## Description

Dogfooding 0.2.1: each rebuild deletes the old hashed sprite. A page from the previous deploy still cached in a browser or CDN points at a sprite that no longer exists. Only some hosts keep old deploy assets.

## Acceptance Criteria

- [x] Decide (ADR or doc) whether a build keeps the previous hashed sprite or documents the deploy-skew risk — evidence: docs/adr/0022-builds-keep-only-the-current-sprite.md; troubleshooting.md sprite 404s (2026-10-15)
- [x] If kept, pruning stays deterministic and check is not affected — evidence: not kept: pruning and check unchanged (build.test.ts R-15 + idempotence tests pass) (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] ADR-0022 accepted: builds keep only the current sprite (keeping the previous one makes output depend on disk state and weakens check); deploy skew fixes documented in the troubleshooting 'sprite 404s' entry (sync without delete, sprite before HTML, short HTML caches).
- [2026-10-15] Completed