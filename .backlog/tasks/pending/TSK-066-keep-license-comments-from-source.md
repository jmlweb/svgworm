---
id: TSK-066
title: Keep license comments from source SVGs
status: pending
priority: P4
tags: [licensing, svgo, output]
created: 2026-10-15
source: manual
depends-on: []
---

# Keep license comments from source SVGs

## Description

Dogfooding 0.2.1: lucide-static files start with `<!-- @license lucide-static ... - ISC -->`; svgworm strips it. ISC/MIT ask to keep the notice with copies, so users of icon packages may want it kept.

## Acceptance Criteria

- [ ] Decide whether @license / preserved comments (/*! or <!-- @license) are kept in the sprite or listed elsewhere
- [ ] Implement the decision with a fixture test

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created