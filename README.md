# svgworm

> Zero-JS, type-safe SVG sprites. A framework-agnostic CLI with deterministic output, plus a thin React adapter that works in Server Components.

**Status: pre-alpha, starting the v0.1 build.** The stack is decided ([ADR-0008](docs/adr/0008-tech-stack-and-package-layout.md)), but there is no package code on this branch yet. The previous prototype lives on `main` and is kept only as a reference.

## The idea

1. Point svgworm at a folder of SVG icons.
2. It emits:
   - one or more hashed, cacheable **sprite files** (`<symbol>` per icon)
   - a **manifest** mapping sprite names to their public URLs
   - **types**, so icon names are checked at compile time
   - optional **adapter code**, starting with an `Icon` component for React that ships no client JavaScript
3. Your app renders `<svg><use href="/<group>.<hash>.svg#<icon-id>"/></svg>`, and the generated code writes that markup for you.

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/vision.md](docs/vision.md) | Problem, users, positioning, non-goals |
| [docs/viability.md](docs/viability.md) | Viability analysis and lessons from the prototype |
| [docs/requirements.md](docs/requirements.md) | Functional requirements (user stories) |
| [docs/output-contract.md](docs/output-contract.md) | Draft of what the CLI generates |
| [docs/open-questions.md](docs/open-questions.md) | Unresolved questions that feed the spikes |
| [docs/adr/](docs/adr/) | Architecture Decision Records |

## Working on this project

Read [AGENTS.md](AGENTS.md). The backlog is managed with flowstate in [`.backlog/`](.backlog/).
