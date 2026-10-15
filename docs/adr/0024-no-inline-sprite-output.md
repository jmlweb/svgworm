# 0024. No inline sprite output

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-022
- **Resolves:** Q-25, the inline part of Q-04; amends principle 1 in AGENTS.md

## Context

R-13 asked for optional inline output "for small sets or single-file deliverables", and principle 1 said "An inline sprite is opt-in". Q-25 asked which form: a raw SVG string, a framework component, or both. Q-04 left one part open: `<style>` leaking from an inline sprite into the page.

The primary target is a Next.js App Router app rendering icons in Server Components ([ADR-0002](0002-agnostic-core-react-adapter.md)). In that setup a server-rendered element is sent twice: once as HTML and once inside the RSC payload that hydration and client navigation read. `docs/vision.md` already names the cost of inline sprites (every response carries the whole set, uncached).

## Options considered

1. **Raw SVG string in the generated module** (`export const spriteMarkup`), rendered by the app with `dangerouslySetInnerHTML`, plus `use` icons switched to `#id`.
2. **A framework component** (`<SvgwormSprite />` in `@svgworm/react`, a slot in `Icon.astro`).
3. **Both.**
4. **No inline mode.** Keep the external, year-cached sprite as the only delivery.

Options 1 to 3 all need a contract change (a markup field or file, and a mode flag so adapters render `#id`), adapter changes in React and Astro, and a rule for page ids colliding with symbol ids, since an inline sprite shares the document's id space.

## Decision

Option 4. svgworm emits no inline sprite, and the adapters keep rendering the external sprite URL. Principle 1 in AGENTS.md drops "An inline sprite is opt-in" and links here. R-13 is closed as rejected.

What inline would buy, and where it goes instead:

- **One request fewer.** The sprite is one immutable request, fetched once per site, not once per page. Inlining moves those bytes into every HTML response, twice in the App Router.
- **Cross-origin assets (Q-02).** Inline would sidestep the same-origin rule, but at the per-page cost below. Q-02 is decided separately (TSK-067).
- **Single-file deliverables** (an HTML email, a static export with no server): out of scope for a tool that sells a cacheable sprite. The manifest names the sprite file and every symbol id, so such a build can inline it in its own template step.

Q-04's inline part needs no answer: the sprite holds no `<style>` at all, because every rule is inlined into attributes and a leftover `<style>` is an error ([ADR-0004](0004-per-icon-color-classification.md)). Only the stack file has a `<style>`, its `:target` rule, and the stack is never meant to be inlined.

## Evidence

Measured on 2026-10-15 in `examples/next-app-router` (Next.js 16, Turbopack, `next build`), with the example's own 2,182-byte sprite (license comment removed) rendered in the root layout with `dangerouslySetInnerHTML`:

| | `index.html` raw | gzip -9 | occurrences of `i-brand--about` |
| --- | ---: | ---: | ---: |
| External sprite (today) | 13,963 B | 2,920 B | 4 |
| Inline sprite | 18,895 B | 4,115 B | 6 |

The HTML grew by 4,932 bytes, 2.26 times the sprite, because the symbol markup is sent once as HTML and once, escaped, in the RSC payload (two extra occurrences of the symbol id). That growth repeats on every HTML response and every client navigation payload that carries the layout, while the external sprite is one request cached for a year. At 40 icons (1.6 KiB gzipped, ADR-0023) the per-page cost is about 3.6 KiB gzipped on every page, against zero after the first visit.

## Consequences

- No output-contract change. `docs/output-contract.md` §4 says there is no inline sprite and links here.
- AGENTS.md principle 1, `docs/requirements.md` R-13, `docs/open-questions.md` Q-04 and Q-25, `llms.txt`, both skills and the comparison page are updated.
- A user who needs inline markup reads the sprite file named in `manifest.json` in their own template; svgworm does not document that as a recommended path.
