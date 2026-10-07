# 0003. Fresh start on an orphan branch

- **Status:** accepted
- **Date:** 2026-10-07

## Context

The prototype on `main` has structural flaws (see [viability.md](../viability.md)): a broken link between file mode and the component, global color handling, order-dependent ids, and a CLI coupled to generation. Fixing it in place would carry its assumptions forward.

## Decision

Start from scratch on the orphan branch `next`, which holds only docs, agent rules, and the backlog. `main` stays untouched as reference. Ideas are ported through flowstate learnings, not by copying code.

## Evidence

The eight structural flaws listed in [viability.md](../viability.md) under "Lessons from the `main` prototype". Most touch the core data flow (ids, color, delivery), so they can't be fixed locally.

## Consequences

- History is clean, and design decisions are written down before any code.
- When `next` becomes the default, `main` gets archived (for example tagged `prototype-v0`). That needs a follow-up decision.
