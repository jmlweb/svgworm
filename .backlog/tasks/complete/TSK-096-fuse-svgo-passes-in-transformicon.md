---
id: TSK-096
title: Fuse svgo passes in transformIcon (5 optimize() rounds to 1)
status: complete
priority: P3
tags: [perf, core, svgo]
created: 2026-10-16
source: manual
depends-on: []
started: 2026-10-16
completed: 2026-10-16
---

# Fuse svgo passes in transformIcon (5 optimize() rounds to 1)

## Description

### Why

Each icon goes through svgo `optimize()` five times in `src/core/svg/transform.ts`, and every call is a full sax parse plus a stringify:

1. `parseSvgTree(raw)`: capture only; its serialized output is thrown away
2. `normalizeStyles`
3. `parseSvgTree(styled)`: only for `findLeftoverStyles`
4. `optimizeMarkup`: 53% of transform time
5. `mutateSvgTree`

On a cold build of lucide-static (1,539 icons) `transformIcon` is about 320 ms of 528 ms sampled, and `sax` alone is 74 ms self time. svgworm's own steps are small: validate 12 ms, classify 5 ms, renameIds 3.5 ms.

### Approach (prototyped 2026-10-16)

**Variant B (target): one `optimize()` call.** Plugins in order:

- `svgworm-intake`: runs `validateTree`, `collectLicenseComments`, and `resolveViewBox` on a *copy* of the root attributes, because later plugins mutate them
- `STYLE_PLUGINS`
- `svgworm-leftover`: runs `findLeftoverStyles`
- `OPTIMIZE_PLUGINS`
- `svgworm-transform`: today's `mutateSvgTree` callback body

Diagnostics leave through a non-`Error` sentinel class thrown from the plugin. A stage marker maps any other throw to today's diagnostic:

- a parse error gets the `line X, column Y:` message
- a style or optimize plugin throw gets `svgo could not process the file: …`
- a throw from svgworm's own code is rethrown

**Variant A (fallback): 3 rounds, identical by construction.**

- The intake plugin goes first in `normalizeStyles`.
- The leftover plugin goes first in `optimizeMarkup`, so it reads a fresh parse of the same styled text, exactly as today.
- `mutateSvgTree` stays as it is.

### Evidence

The parity harness compares the full `transformIcon` result JSON (errors included) in modes auto, mono and preserve. Corpora:

- repo fixtures, plus 17 synthetic edge cases (@media, CDATA, entities, whitespace, prefixed script, license comments, style attrs, unclosed XML, no viewBox)
- lucide-static, @tabler/icons outline and filled, flag-icons (multicolor: gradients, clipPath, ids), simple-icons

Result: about 33k cases, 0 diffs for A, A2 and B.

Timings:

| | Warm | Cold, lucide | Cold, 20 icons |
|---|---|---|---|
| Variant A | 12–16% faster | 434 → 386 ms | 111 → 111 ms |
| Variant B | 23–34% faster | 434 → 350 ms | 111 → 104 ms |

Error paths reached by real inputs: invalid-xml, not-svg-root, forbidden-element, external-reference, viewbox/underivable, style/leftover, style/unscopable, forced-mono-unsafe.

Not verified by real input: the `svgo could not process the file` path. Today only the mocked test in `transform.test.ts` reaches it, so keep an equivalent test.

### Risks

- **Sentinel propagation is current svgo 4.1.0 behavior, not documented.** `invokePlugins` doesn't catch, so a thrown value leaves `optimize`. Pin it with a test so an svgo bump fails loudly.
- **B never reparses the styled output.** Today a styled output that fails to parse again is rejected. B can't reject it. Never observed.
- **No output contract change**, so no ADR is needed.

## Acceptance Criteria

- [x] transformIcon runs one svgo optimize() per icon (or 3 if B is dropped for variant A, with the reason in the progress log) — evidence: transform.ts: one optimize() call with intake, STYLE_PLUGINS, leftover, OPTIMIZE_PLUGINS, transform plugins (variant B) (2026-10-16) (2026-10-16)
- [x] Error precedence unchanged (parse, validate, viewBox, style plugin, leftover, optimize), with a test per stage — evidence: transform.test.ts TSK-096 block: parse, validate, viewBox, style plugin, leftover, optimize precedence tests → pass (2026-10-16) (2026-10-16)
- [x] A unit test pins that a non-Error sentinel thrown from a plugin propagates out of svgo optimize uncaught — evidence: transform.test.ts pins that a plugin throw leaves optimize unwrapped → pass (2026-10-16) (2026-10-16)
- [x] Contract snapshots unchanged; pnpm verify and pnpm determinism:fingerprint pass — evidence: pnpm verify → exit 0; determinism:fingerprint identical to pre-change; parity harness 37,377 cases identical (2026-10-16) (2026-10-16)
- [x] Progress log has before/after benchmark on lucide (cold and warm) — evidence: progress log has lucide before/after numbers (2026-10-16) (2026-10-16)
- [x] Patch changeset for svgworm — evidence: .changeset/single-svgo-run.md (2026-10-16) (2026-10-16)

## Notes

## Learnings

- LRN-048: svgo plugins can carry svgworm's own steps through one optimize() run
## Progress Log

- [2026-10-16] Created
- [2026-10-16] Started
- [2026-10-16] Variant B implemented: one svgo optimize() per icon. Diagnostics leave through a Rejection thrown from svgworm's plugins; a stage marker maps other throws to the parse message, to "svgo could not process the file", or rethrows svgworm bugs.
- [2026-10-16] Deviation: Rejection extends Error instead of a non-Error sentinel, because the repo's oxlint only-throw-error rule rejects throwing non-Errors. The catch tests instanceof Rejection first, so it stays unambiguous. The pin test asserts svgo rethrows a plugin's error unwrapped (identity).
- [2026-10-16] Parity harness (scratch, not committed): full transformIcon JSON for repo fixtures, 18 synthetic edge cases, lucide-static 1.57, @tabler/icons 3.49 outline and filled, flag-icons 7.6, simple-icons 16.35, in modes auto/mono/preserve: 37,377 cases, byte-identical before and after. Error codes reached: invalid-xml, not-svg-root, forbidden-element, external-reference, viewbox/underivable, style/leftover, style/unscopable, forced-mono-unsafe.
- [2026-10-16] Benchmark, lucide-static 1.57 (2,154 icons), transformIcon only, 14-core Mac: cold (process wall time, 5 runs) 551-575 ms before, 424-430 ms after (about -24%); warm (median of 7) 344 ms before, 228 ms after (-34%). 20 icons cold: 113-118 ms before, 109-113 ms after.
- [2026-10-16] Completed