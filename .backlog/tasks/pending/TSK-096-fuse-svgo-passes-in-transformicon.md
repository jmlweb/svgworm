---
id: TSK-096
title: Fuse svgo passes in transformIcon (5 optimize() rounds to 1)
status: pending
priority: P3
tags: [perf, core, svgo]
created: 2026-10-16
source: manual
depends-on: []
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

- [ ] transformIcon runs one svgo optimize() per icon (or 3 if B is dropped for variant A, with the reason in the progress log)
- [ ] Error precedence unchanged (parse, validate, viewBox, style plugin, leftover, optimize), with a test per stage
- [ ] A unit test pins that a non-Error sentinel thrown from a plugin propagates out of svgo optimize uncaught
- [ ] Contract snapshots unchanged; pnpm verify and pnpm determinism:fingerprint pass
- [ ] Progress log has before/after benchmark on lucide (cold and warm)
- [ ] Patch changeset for svgworm

## Notes

## Learnings

## Progress Log

- [2026-10-16] Created