# 0014. `IconName` stays a plain string-literal union

- **Status:** accepted
- **Date:** 2026-10-12
- **Task:** TSK-005
- **Resolves:** Q-30

## Context

The output contract ([ADR-0012](0012-output-contract-v0.1.md), `docs/output-contract.md` § Types) emits `IconName` as a plain union of every public name, sorted by code point, and left the shape for large sets open (Q-30): would thousands of names make `tsc` or editor completion slow, and should the emitter switch to an `as const` tuple or to per-namespace template-literal unions? The question was deferred past v0.1 (ADR-0005) and the task said to revisit when a user reports more than about 2,000 icons. The maintainer asked to resolve it now, before launch, so the contract does not change later.

## Options considered

1. **Plain union** (current). Simplest emitter, the type reads as a list of names, `IconName` is exactly what the contract says. Chosen.
2. **`as const` tuple plus `(typeof iconNames)[number]`.** Gives a runtime array of names for free, but the union is rebuilt by instantiation at check time: 20,000 instantiations and the slowest check of the three shapes. A runtime list is also already available from `Object.keys(manifest.icons)`.
3. **Per-namespace template-literal unions.** Smaller `.d.ts` (30% at 20k names), same check time as the union, slightly more memory. It would add per-namespace types to the contract and make the emitter depend on the namespace structure, for no measured benefit.

## Decision

Keep `IconName` as a plain string-literal union for every set size. No size threshold, no alternative shape, no new exports. The output contract text that called the shape "deferred" is updated to point here.

## Evidence

[TSK-005 spike](../../spikes/TSK-005-ts-perf/RESULTS.md), 2026-10-12, Apple M4 Max, Node 24.13, median of 3:

| Names | Shape | TS 6.0.3 check | TS 7.0.2 check | Completion (TS 6 service) |
|------:|-------|------:|------:|------:|
| 20,000 | **union** | **0.14 s** | **0.05 s** | 5 ms, 20,000 entries |
| 20,000 | tuple | 0.23 s | 0.11 s | 4 ms |
| 20,000 | template | 0.16 s | 0.05 s | 4 ms |
| 5,000 | union | 0.06 s | 0.01 s | 1 ms |
| 500 | union | 0.03 s | 0.002 s | 1 ms |

An unknown name fails type-checking at every size (the consumer carries a `@ts-expect-error` use, plus a hand-added second unknown name as a negative control). The sizes bracket the largest icon sets in the TSK-003 corpus (simple-icons has about 3,300 icons).

## Consequences

- Q-30 is closed; `docs/output-contract.md` drops the "deferred" note, and TSK-021 (multiple sprites) does not need to revisit the type shape.
- The generated `.d.ts` grows linearly (about 21 bytes per name). At 20,000 names it is 409 KB, which only the type-checker reads.
- If a user ever reports a slow check, the first suspect is the consumer (number of call sites or a wide `Record<IconName, …>` built from it), not the union. Reopen with a reproduction, not a size.
