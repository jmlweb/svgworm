---
id: LRN-024
title: Spike-made contract samples must come from the product pipeline
status: active
tags: [output-contract, svgo, determinism]
task: TSK-011
created: 2026-10-11
---

## Context
ADR-0012 froze docs/samples/output-contract-v0.1 and required the core to reproduce it byte for byte. The sample came from the TSK-004 spike, which never ran svgo.

## Insight
With the pinned svgo preset-default, path data, attribute order and shape-to-path output change, so sprite bytes and hashes differ. Manifest keys, types and structure stay the same.

## Application
Generate any "frozen" sample with the real pipeline (svgo included) before freezing it. Add a byte-equality test (sample.test.ts) so drift shows up as a reviewed snapshot diff.
