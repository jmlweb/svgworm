---
id: TSK-062
title: Actionable errors: did-you-mean and fix hints
status: complete
priority: P3
tags: [cli, errors, react, dx]
created: 2026-10-15
source: manual
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# Actionable errors: did-you-mean and fix hints

## Description

Dogfooding 0.2.1: `--sources` prints the Node parseArgs text about positional arguments. Collisions name the files but not the fix. `Unknown icon "home"` at runtime gives no suggestion (Astro check already says "Did you mean"). Invalid XML shows `<input>:2:0: Unclosed root tag`.

## Acceptance Criteria

- [x] Unknown CLI flags suggest the closest known flag (e.g. --sources to --source) instead of the raw parseArgs text — evidence: args.test.ts: suggests the closest flag for an unknown one (--sources → --source; --bogus → none) → pass (2026-10-15)
- [x] name/collision errors say how to fix (rename, drop --flatten, or folders) — evidence: collisions.test.ts: three cases (same folder → rename; different folders + flatten → turn flatten off; different folders → rename files or folders) → pass; compile.ts passes { flatten } (2026-10-15)
- [x] The @svgworm/react Unknown icon runtime error suggests the closest names — evidence: create-icon.test.tsx: suggests the closest names for an unknown one (hom → home) → pass; Levenshtein copy in packages/react/src/suggest.ts, no new dependency (2026-10-15)
- [x] svg/invalid-xml messages do not show <input> as the location — evidence: tree.ts rewrites <input>:L:C: to line L, column C:; invalid-errors.txt snapshot reviewed and updated (2026-10-15)
- [x] Tests cover each message — evidence: pnpm vitest run → 33 files, 520 passed (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] cli/suggest.ts and a copy in packages/react/src/suggest.ts (adapter may not import svgworm). Icon.astro keeps its shorter Unknown icon message; astro check already suggests names at type level. Changeset actionable-errors.md. lint, format, typecheck exit 0.
- [2026-10-15] Completed