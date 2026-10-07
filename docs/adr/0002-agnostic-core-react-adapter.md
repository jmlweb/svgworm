# 0002. Framework-agnostic core with a React adapter first

- **Status:** accepted
- **Date:** 2026-10-07

## Context

The prototype mixed SVG processing with JSX generation (`html-to-jsx` inside the icon formatter). That made other frameworks impossible to support and blurred responsibilities.

## Options considered

1. **React only**: simpler, but it limits the audience and couples processing to JSX.
2. **Agnostic core + adapters**: the core emits sprites, a manifest, and types. Adapters only render markup.

## Decision

Option 2. React is the first adapter, and it must be a valid Server Component with zero client JS.

## Evidence

The `main` prototype: JSX generation inside the icon formatter, and a CLI coupled to generation with no programmatic API (see [viability.md](../viability.md), lesson 7).

## Consequences

- The output contract becomes a public API, and changing it needs an ADR.
- Adapters can't re-process SVGs.
- How packages are laid out (monorepo vs subpath exports) is still open (Q-41).
