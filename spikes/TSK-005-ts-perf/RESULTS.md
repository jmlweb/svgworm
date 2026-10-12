# TSK-005 spike: TypeScript cost of large `IconName` sets

_Date: 2026-10-12. Throwaway benchmark, evidence for [ADR-0014](../../docs/adr/0014-icon-name-type-shape.md). Rerun with `node spikes/TSK-005-ts-perf/bench.mjs [sizes] [runs]`; `out/` is generated and ignored._

## Question (Q-30)

v0.1 emits `IconName` as a plain string-literal union. Does type-checking or editor completion get slow with 5,000 or 20,000 names, and would an `as const` tuple or namespaced template-literal unions be better?

## Method

For 500, 5,000 and 20,000 names (`ns<0..19>/icon-<n>`), three shapes of `icons.d.ts`:

- **union**: `export type IconName = | "a" | "b" …` (the v0.1 contract);
- **tuple**: `export declare const iconNames: readonly ["a", "b", …]; export type IconName = (typeof iconNames)[number];`
- **template**: one literal union per namespace, joined by template literals: ``type N0 = `ns0/${"icon-0" | …}`; export type IconName = N0 | … | N19;``

A consumer renders 300 icons through a typed `Icon({ name })`, reads one manifest entry, and has one `@ts-expect-error` use with an unknown name. Every benchmark compile exits 0 (checked by hand on `union-20000` after the run), so the expected error is the only one; a second unknown name added by hand fails with `TS2322`, which is the negative control. An earlier run of this spike had a completion probe that was itself a type error, which made the control meaningless until it was cast (LRN-030); the timings were the same within noise.

Measured, median of 3 runs on an Apple M4 Max, Node 24.13:

- `tsc --noEmit --extendedDiagnostics` with TypeScript 6.0.3 (repo toolchain) and 7.0.2 (native, via `pnpm dlx`);
- editor completion: TS 6 language service, `getCompletionsAtPosition` at `name: '|'` after the program is warm.

## Results (`results.json`)

| Names | Shape | `.d.ts` bytes | TS 6 check | TS 6 total | TS 6 memory | TS 7 check | TS 7 total | Completion | Instantiations |
|------:|-------|------:|------:|------:|------:|------:|------:|------:|------:|
| 500 | union | 9.8 KB | 0.03 s | 0.12 s | 70 MB | 0.002 s | 0.019 s | 1 ms | 24 |
| 500 | tuple | 9.4 KB | 0.03 s | 0.12 s | 72 MB | 0.002 s | 0.02 s | 0 ms | 527 |
| 500 | template | 7.1 KB | 0.03 s | 0.12 s | 72 MB | 0.002 s | 0.019 s | 0 ms | 24 |
| 5,000 | union | 99 KB | 0.06 s | 0.15 s | 123 MB | 0.011 s | 0.026 s | 1 ms | 24 |
| 5,000 | tuple | 95 KB | 0.07 s | 0.16 s | 133 MB | 0.018 s | 0.034 s | 1 ms | 5,027 |
| 5,000 | template | 68 KB | 0.06 s | 0.15 s | 130 MB | 0.012 s | 0.028 s | 1 ms | 24 |
| 20,000 | union | 409 KB | **0.14 s** | 0.23 s | 118 MB | **0.051 s** | 0.066 s | **5 ms** | 24 |
| 20,000 | tuple | 390 KB | 0.23 s | 0.32 s | 108 MB | 0.114 s | 0.131 s | 4 ms | 20,027 |
| 20,000 | template | 283 KB | 0.16 s | 0.26 s | 141 MB | 0.052 s | 0.068 s | 4 ms | 24 |

Completion returns every name (500, 5,000 or 20,000 entries) in single-digit milliseconds for all shapes.

## Reading

- Nothing here is slow. At 20,000 names the plain union costs 0.14 s of check time on TS 6 and 0.05 s on TS 7, in a project that is otherwise empty. A real app's own code dominates.
- The tuple is the worst shape: one instantiation per name (`(typeof iconNames)[number]` builds the union at check time), and it is the only one that gets measurably slower (0.23 s vs 0.14 s on TS 6, 0.11 s vs 0.05 s on TS 7 at 20k).
- The template shape saves bytes (30% smaller file at 20k) but not time, costs a little memory, and would change the public contract (`IconName` stays a union, but the file shape and any per-namespace exports would be new API) and complicate the emitter for no measured gain.
- Memory numbers are noisy between runs (same program, 70 vs 125 MB); treat them as "under 150 MB".

## Not measured

- Very large consumers (thousands of `<Icon>` call sites). Each call site checks a string literal against the union, which TypeScript does by set lookup for unions of literals, so the cost scales with the consumer, not with the union.
- Editors other than the TS language service (the VS Code TS server uses the same service).
- Icon names with many shared prefixes (template literal unions could be relevant there); the fixture names are already prefix-heavy (`ns0/icon-…`).
