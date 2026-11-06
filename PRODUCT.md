# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: Next.js App Router teams with their own icon set**, exported from design tools. They do not search for "sprite generator". They arrive through a symptom: bloated bundles, multicolor icons going black, gradients blank in SSR, or a Turbopack plugin that fails. Their job is to get custom SVGs rendering correctly in Server Components, then stop thinking about icons.

**Secondary:** teams on Astro, Vue, Svelte and Vite, design-system owners, and AI agents that install and configure svgworm from the docs alone. Agents are real users with a measured track (`evals/agent/`), but design decisions favor the primary user when the two conflict.

## Product Purpose

svgworm is an open-source CLI that turns a folder of SVG files into type-safe, cacheable SVG sprites, plus thin framework adapters. It exists because the common options each fail one way: component-per-icon bloats bundles, inline sprites cannot be cached, icon fonts are mono only, and hand-made sprites are untyped.

Success is adoption. Until the kill-criteria review on 2027-01-05 (ADR-0005), the measures are weekly npm downloads, distinct external issue and PR authors, and public starter or template adoption.

## Positioning

**Per-icon color with zero config.** Drop in a design team's SVGs and they render correctly: mono icons follow `currentColor`, multicolor icons are never touched, and masks and clip paths keep working. The evidence is 31,390 icons at 99.98% agreement with rendering, with zero multicolor icons recolored.

Zero client JS, typed names and a hashed sprite support this claim, but they are table stakes that neighboring tools can also say. Lead with what renders correctly, not with the sprite as a format.

## Operating Context

- Evaluated from a symptom: a visitor lands from a search, a GitHub thread or a post, already holding a concrete failure.
- Used in a terminal and in CI: `pnpm svgworm`, `check`, `watch`, `init`, and `migrate svgr`. Plain and `--json` reporters, stable exit codes 0, 1 and 2.
- Read by agents through `llms.txt`, `/llms-full.txt`, Markdown versions of pages, the JSON Schema for the config, and `skills/`.
- Compared directly with SVGR, @neodx/svg, vite-plugin-icons-spritesheet and unplugin-icons on the site's comparison page.

## Capabilities and Constraints

- Published as 0.x: `svgworm` (core and CLI) and `@svgworm/react`. Astro, Vue and Svelte get generated components from `init`, not packages. An optional `svgworm/vite` plugin rebuilds icons in `vite dev`.
- The website is `apps/site` (Astro, Cloudflare Workers static assets). It dogfoods svgworm through the generated `Icon.astro`. Its own UI may use client JS; icons never need it.
- Delivery forms are `use`, `img` and `mask`, chosen per icon. There is no inline sprite mode. `crossOrigin: "inject"` is the single opt-in that needs a loader script.
- Write the name lowercase: "svgworm". Say "0.x", never a specific version, in public text.
- Non-goals for v1: fetching remote icon sets, raster or font output, visual icon editing, runtime loading by name from a server.

## Brand Commitments

- **Name and identity:** svgworm, with its existing logo files in `docs/assets/` and the private Design System artifact referenced in `CLAUDE.local.md`. That artifact is a general guideline, not a strict spec: a page that follows it to the letter and looks plain is wrong.
- **Voice:** evidence over adjectives. Every claim links to something reproducible. Short sentences, with bold on the words a reader scans for.
- **Fair to competitors:** comparisons say where each tool is the better choice, and bugs found in competitors go upstream before they are published.

## Evidence on Hand

- Color classification: 31,390 icons, 99.98% agreement with rendering (ADR-0004, `docs/posts/per-icon-color.md`, `docs/posts/per-icon-color.png`).
- Real-repo sprite sizes for Supabase, cal.com and Refine (`docs/posts/real-world-sprite-numbers.md`, `scripts/bench-repo.mjs`). The post is a draft: its numbers are unpublished until it has been browser-checked and re-run. Never publish those SVG files, because many are third-party logos.
- Browser rendering matrix for Chromium, Firefox and WebKit (`tests/render/matrix.json`). Playwright's WebKit is not Safari.
- The site itself: every icon comes from a real hashed sprite, and its stats are computed at build time.
- Next.js 16 and Vite examples with automated checks (`examples/`).

**Absent, must not be fabricated:** testimonials, customer logos, adoption claims, download or star milestones, and starter or template adoption. `docs/metrics/manual.json` records no starters and no target-list PRs.

## Product Principles

1. **Correct rendering is the promise.** A visitor should see that their icons will look right before anything else.
2. **Prove it, don't describe it.** Prefer real output, real numbers and reproducible checks over adjectives.
3. **Start from the symptom.** Meet the primary user at the failure they already have, then show the fix.
4. **Copy-pasteable beats explained.** The path from landing to a working icon stays short, and works for a human or an agent.
5. **Honest about limits.** State where svgworm is not the better choice, and what a number does not say.
