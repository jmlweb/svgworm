---
id: TSK-006
title: Define icon naming, namespaces and collision policy
status: complete
priority: P1
tags: [design, naming, adr]
created: 2026-10-07
source: manual
depends-on: []
started: 2026-10-07
completed: 2026-10-07
---

# Define icon naming, namespaces and collision policy

## Description

Resolve Q-31, Q-32, R-02, R-03. Specify deterministic name derivation: path to name, separator, Unicode/case normalization, folder flattening, collision = error vs alias map. Old prototype used order-dependent counter — avoid.

Timebox: 1 week (TSK-014). Proposed defaults: `/` separator, NFC normalization, lowercase kebab ids, collisions are an error. The alias map is deferred past v0.1 (Q-32). Any question still open at the end of the timebox takes the simplest reversible option, and that option is noted.

## Acceptance Criteria

- [x] Rules written in output-contract.md
- [x] Table of example inputs to expected names
- [x] ADR written
- [x] Finished within the 1-week timebox; open items noted with the default taken

## Notes

## Learnings

- LRN-010: Icon name and symbol id must be different strings
- LRN-011: NFC alone doesn't make names case- and order-stable
- LRN-012: Don't use . as the internal-id delimiter in sprites
## Progress Log

- [2026-10-07] Created
- [2026-10-07] Started
- [2026-10-07] Wrote ADR-0007 (accepted) and the naming section of output-contract.md, with an example table checked by spikes/TSK-006-icon-naming/check.mjs. Q-31/Q-32 resolved; R-02/R-03 linked. Deviations: symbol id is a separate ASCII encoding (i- prefix, / to --, _hex_); no camelCase splitting. Adversarial review: no blockers, 5 major findings fixed. Open items with defaults listed in ADR. Learnings LRN-010..012. Commit d1e12be on branch tsk-006-icon-naming (not merged).
- [2026-10-07] User kept ADR-0007 accepted. Merged into next.
- [2026-10-07] Completed