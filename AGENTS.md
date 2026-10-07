# AGENTS.md

Source of truth for any AI agent or human working on svgworm. Read this first.

## What svgworm is

A CLI that turns a folder of SVG files into **type-safe, cacheable SVG sprites** plus thin framework adapters. React comes first, and its component must work in Server Components with zero client JS. Published as an open-source npm package.

Full context: [docs/vision.md](docs/vision.md) and [docs/viability.md](docs/viability.md).

## Current phase: design

- **No implementation code yet.** Spikes may produce throwaway prototypes under `spikes/<task-id>-<slug>/`. A prototype is evidence, not product code.
- **No tool, library, or runtime choices without an ADR** in `docs/adr/` (see `.claude/rules/decisions.md`).
- The old prototype on `main` is reference material only. Port *ideas*, not code.

## Product principles (non-negotiable unless an ADR changes them)

1. **Zero-JS by default.** The default delivery is an external sprite file referenced via `<use href>`. An inline sprite is opt-in.
2. **Deterministic output.** The same input gives byte-identical output on every OS and every run. No dependence on crawl order, timestamps, or locale.
3. **Agnostic core, thin adapters.** The core knows nothing about React or any other framework. Adapters only consume the output contract.
4. **Types are the product.** Icon names must be checked at compile time, and an invalid name must be a type error.
5. **Fail loudly and early.** Name collisions, invalid SVGs, and unsupported features produce clear errors, never silent renames.
6. **Per-icon correctness.** Color handling (mono, stroke, multicolor) is decided per icon, not globally.

## Workflow (flowstate)

Backlog lives in `.backlog/`. Always use the flowstate skills; never edit index files by hand.

| When | Skill |
|------|-------|
| Session start / choosing work | `/flowstate:next-task`, `/flowstate:overview` |
| Before starting | `/flowstate:learnings` (search relevant tags) |
| Begin work | `/flowstate:start-task <id>` |
| Need a design before coding | `/flowstate:idea`, then `/flowstate:review-idea` |
| Blocked | `/flowstate:block-task` |
| Found a bug or a surprise | `/flowstate:report` |
| Non-obvious insight | `/flowstate:add-learning` |
| Finished | `/flowstate:complete-task` |
| New work discovered | `/flowstate:add-task` (don't silently expand scope) |

## Definition of Done

- All acceptance criteria of the task are met and stated in the task's progress log.
- Spikes end with an ADR (accepted or rejected) and a learning, plus updates to `docs/open-questions.md`.
- Any doc made stale by the change is updated in the same change.
- Once code exists: tests pass and output snapshots are reviewed.
- Commits follow Conventional Commits. Never push without explicit permission.

## Docs map

- `docs/vision.md`: why and for whom
- `docs/viability.md`: feasibility, risks, prototype lessons, competitors
- `docs/requirements.md`: what (user stories)
- `docs/output-contract.md`: the core/adapter boundary (generated files)
- `docs/open-questions.md`: unknowns; each one should map to a task
- `docs/adr/`: decisions, numbered and immutable once accepted (supersede, don't edit)
- `.claude/rules/`: focused rules for architecture, decisions, and testing
