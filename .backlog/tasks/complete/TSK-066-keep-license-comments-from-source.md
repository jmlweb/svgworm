---
id: TSK-066
title: Keep license comments from source SVGs
status: complete
priority: P4
tags: [licensing, svgo, output]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Keep license comments from source SVGs

## Description

Dogfooding 0.2.1: lucide-static files start with `<!-- @license lucide-static ... - ISC -->`; svgworm strips it. ISC/MIT ask to keep the notice with copies, so users of icon packages may want it kept.

## Acceptance Criteria

- [x] Decide whether @license / preserved comments (/*! or <!-- @license) are kept in the sprite or listed elsewhere — evidence: Decision: keep them in the sprite. A comment whose text starts with @license or ! is written once per distinct text before the root element of the sprite/stack that holds the icon, sorted; recorded in docs/output-contract.md, how-it-works.md, config.md (package section), llms.txt and the changeset keep-license-comments.md (minor) (2026-10-15)
- [x] Implement the decision with a fixture test — evidence: transform.test.ts (collects @license and ! comments, trimmed, unique, sorted; plain comments dropped), assemble.test.ts (header once, sorted, -- escaped), compile.test.ts (two Lucide icons → one notice at the top); fixture snapshot sprite.svg now starts with the lucide-static notice (fixtures/stroke/lucide-house.svg and duplicates/actions/close.svg); 509 tests pass; site sprite regenerated (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] svgo preset-default kept <!--! --> comments inside symbols, so removeComments now runs with preservePatterns false: our collector owns the notices. Fingerprint changes on purpose (comment bytes are hashed); CI compares it across OSes.
- [2026-10-15] Completed