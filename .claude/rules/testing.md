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

## Strategy (to be confirmed by the stack ADR)

- Unit tests for pure core steps (id generation, color classification, normalization).
- Snapshot tests for the whole output contract per fixture set. Review snapshot diffs like code.
- Determinism test: shuffled input order must give identical output.
- Type tests: an invalid icon name must fail type-checking.
- Browser rendering checks for sprite features that differ between browsers. The spike decides how to do this.
