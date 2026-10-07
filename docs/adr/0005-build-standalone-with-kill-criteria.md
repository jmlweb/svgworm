# 0005. Build svgworm as a standalone tool, with a lean v0.1 and kill criteria

- **Status:** accepted
- **Date:** 2026-10-08
- **Task:** TSK-007
- **Resolves:** Q-50

## Context

The competitor review (TSK-007) found that @neodx/svg already covers hashed multi-sprites, typed metadata, and a Node API. That removed half of the differentiators we had planned. The goal of the project is **adoption**, not learning. So we had to decide whether a separate tool is justified, or whether contributing to neodx would serve users better.

## Options considered

1. **Stop.** No new work. Wrong if the gap is real, and the evidence says it is.
2. **Contribute to @neodx/svg.** Add automatic color classification and RSC guidance upstream. Pros: no new package to grow. Cons: neodx has about 2k weekly downloads and is configuration-first. Its documented Next.js path fails under Turbopack. Its defaults conflict with ours (global color reset, client-side inject), so contributing means changing its philosophy, not adding a feature.
3. **Build svgworm**, positioned narrowly, shipped quickly, with an explicit kill criterion. Chosen.

## Decision

Build svgworm.

**Positioning:** icon sprites for Next.js App Router and Server Components that are **correct with zero config**:
- per-icon color that never damages multicolor icons;
- gradients and masks that render;
- no bundler plugin needed.

Sprites, types, and hashing are table stakes, not the pitch.

**Target user:** teams with their own icon set exported from design tools, often with hardcoded colors. Teams using public sets (lucide-react, Iconify) are not the primary target.

**Process:** stop adding design spikes beyond what can break the default delivery. Ship a lean v0.1 and measure adoption.

**Kill criteria:** review 12 weeks after v0.1.0 is published on npm. Continue if **any** of these holds:
- ≥ 500 weekly npm downloads (four-week average);
- ≥ 5 issues or PRs from distinct external people;
- adoption by one public starter or template.

If none holds, stop active development and offer the color classifier to @neodx/svg.

## Evidence

- [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md), @neodx/svg 1.1.1 in Next 16.4:
  - the webpack plugin fails under Turbopack;
  - multicolor icons are flattened by default;
  - gradient and mask icons are blank in SSR;
  - masks are altered;
  - NFD file names change ids.
- [TSK-003 spike](../../spikes/TSK-003-color-classification/RESULTS.md): automatic color classification agrees with rendering on 99.98% of 31,390 icons, recolors no multicolor icon, and every mono rewrite renders correctly. See [ADR-0004](0004-per-icon-color-classification.md).
- Weekly npm downloads on 2026-10-08:

  | Package | Downloads |
  |---------|-----------|
  | @svgr/core | 21.6M |
  | unplugin-icons | 841k |
  | vite-plugin-icons-spritesheet | 248k |
  | svg-sprite | 237k |
  | svgstore | 99k |
  | @neodx/svg | 2k |

  Demand for sprites exists (the 248k plugin, which only works with Vite). The more complete tool (neodx) has not captured it, so features alone don't win.

## Consequences

- Scope shrinks to a v0.1 plan (see the backlog idea that follows this ADR). Several planned spikes become decisions made during implementation.
- Distribution work counts as part of v0.1: a Next.js example, comparison docs, starter outreach.
- The color algorithm is now public (ADR-0004), so our lead is speed and polish rather than something only we can do. Ship before it is copied.
- The kill-criteria numbers are fixed now, before launch, so they can't be moved later to fit the result. Changing them needs a superseding ADR.
