# Testing rules

## Approach: test-first, not strict TDD

- Default loop: write a failing test (unit, snapshot, or type test), make it pass, then refactor.
- Bug fixes start with a test that reproduces the bug.
- Allowed exceptions: spikes, throwaway prototypes, and CLI visuals (animations, colors). Cover CLI visuals with non-TTY output snapshots instead.
- A change without tests needs a stated reason in the task's progress log.

## Fixtures

- Only use icons with an **OSS-compatible license** (MIT, ISC, Apache-2.0, CC0). Record the source and license in `fixtures/LICENSES.md`.
- Never commit the old `svg/` folder from `main`. It looks like proprietary Flaticon/Freepik assets.
- The fixture set must cover these cases: mono fill, stroke-only, multicolor, gradients, masks, clipPath, filters, nested `<svg>`, `<style>` blocks, internal id refs, duplicate names in different folders, non-ASCII file names, and invalid SVG.

## Strategy (runner confirmed by ADR-0008)

- Runner: Vitest. Unit and snapshot tests in `*.test.ts`. Type tests in `*.test-d.ts` (`expectTypeOf` or `@ts-expect-error`), checked by `tsc`. Generated types are type-checked with both TypeScript 6 and 7 in CI.
- CLI output: snapshot the plain (non-TTY) and `--json` reporters, never the clack TTY output.
- Unit tests for pure core steps (id generation, color classification, normalization).
- Snapshot tests for the whole output contract per fixture set. Review snapshot diffs like code.
- Determinism test: shuffled input order must give identical output.
- Type tests: an invalid icon name must fail type-checking.
- Browser rendering checks for sprite features that differ between browsers. The spike decides how to do this.
