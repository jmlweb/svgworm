# Testing rules

## Approach: test-first, not strict TDD

- Default loop: write a failing test (unit, snapshot, or type test), make it pass, then refactor.
- Bug fixes start with a test that reproduces the bug.
- Allowed exceptions: spikes, throwaway prototypes, and CLI visuals (animations, colors). Cover CLI visuals with non-TTY output snapshots instead.
- A change without tests needs a stated reason in the task's progress log.

## Fixtures

- Only use icons with an **OSS-compatible license** (MIT, ISC, Apache-2.0, CC0). Record the source and license in `fixtures/LICENSES.md`.
- Never commit the old `svg/` folder from `main`. It looks like proprietary Flaticon/Freepik assets.
- The fixture set must cover these cases: mono fill, stroke-only, multicolor, gradients, masks, clipPath, filters, markers, CSS variable paints, SMIL color animations, nested `<svg>`, `<style>` blocks, internal id refs, duplicate names in different folders, non-ASCII file names, and invalid SVG.

## Strategy (runner confirmed by ADR-0008)

- Runner: Vitest. Unit and snapshot tests in `*.test.ts`. Type tests in `*.test-d.ts` (`expectTypeOf` or `@ts-expect-error`), checked by `tsc`. Generated types are type-checked with both TypeScript 6 and 7 in CI.
- CLI output: snapshot the plain (non-TTY) and `--json` reporters, never the clack TTY output.
- Unit tests for pure core steps (id generation, color classification, normalization).
- Snapshot tests for the whole output contract per fixture set. Review snapshot diffs like code.
- Determinism test: shuffled input order must give identical output.
- Type tests: an invalid icon name must fail type-checking.
- Browser rendering checks for sprite features that differ between browsers. Method decided by [ADR-0006](../../docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md), reference implementation in `spikes/TSK-002-external-use/src/check.mjs`:
  - Playwright drives its bundled Chromium, Firefox, and WebKit against a page served over HTTP from one origin (`file://` and cross-origin behave differently).
  - The reference for each icon is the original fixture as `<img>`, rendered by the same engine. Never compare across engines.
  - Capture each page on a white and a black background, and recover straight alpha and color from the pair. Firefox can't take transparent element screenshots. Lay cells out on an integer pixel grid so the crops line up.
  - Fail on more than 1% of pixels differing in coverage (Δ > 64) or, for multicolor, in color (Δ > 40). Check mono icons with `color: #ff0000`: same shape, at least 99% of opaque pixels red.
  - Cover every delivery form the manifest can emit (`use`, `img`, `mask`) and the fixture set. Commit the generated matrix and review its diff like a snapshot.
  - Playwright's WebKit is not Safari. Check real Safari and iOS by hand before each release.
