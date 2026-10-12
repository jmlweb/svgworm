---
id: LRN-030
title: Benchmark consumers must type-check cleanly or the negative control proves nothing
status: active
tags: [benchmark, typescript, testing]
task: TSK-005
created: 2026-10-12
---

## Context
The TSK-005 tsc benchmark had a completion probe `Icon({ name: '' })` that was itself a type error, so every run exited non-zero and the `@ts-expect-error` negative control could never be distinguished from "compile failed anyway".
## Insight
`--extendedDiagnostics` prints timings even when the program has errors, so a benchmark can look healthy while its correctness control is dead. Timing numbers were still valid; the proof of "unknown name fails" was not.
## Application
Assert the exit code of each benchmark compile (zero with the expected `@ts-expect-error`, non-zero when it is removed) before trusting any other number. Cast probe values (`'' as IconName`) so only the intended error exists.
