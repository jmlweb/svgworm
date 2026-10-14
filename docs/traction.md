# Traction plan

How svgworm gets real users and gets picked up by AI agents and tools. Adoption is the main risk ([viability.md](viability.md)), and [ADR-0005](adr/0005-build-standalone-with-kill-criteria.md) measures it with fixed kill criteria 12 weeks after v0.1.0. This plan is the work that moves those numbers.

## Starting point

- Repo is public: <https://github.com/jmlweb/svgworm>.
- Channels: LinkedIn and X (jmlweb.es has no blog) and a modest social following. No community presence yet, so the plan cannot rely on a big launch spike.
- Target user ([ADR-0005](adr/0005-build-standalone-with-kill-criteria.md)): Next.js App Router teams with their own icon set exported from design tools. They don't search for "sprite generator". They hit a symptom: bloated bundles, multicolor icons going black, gradients blank in SSR, a Turbopack plugin that fails.
- v0.1.0 was published on 2026-10-13, six weeks ahead of the 2026-11-26 target. The 12-week clock runs; the kill-criteria review is on 2027-01-05 (`node scripts/traction-snapshot.mjs --review`).

## Principles

1. **Lead with evidence, not adjectives.** The 31k-icon color result and the Turbopack spike are the story. Every claim links to a reproducible spike.
2. **Be fair to competitors.** The comparison says where each tool is the better choice. Bugs found in competitors are reported upstream before we publish about them.
3. **Go where the symptom is.** Answer existing questions and open PRs in real repos instead of broadcasting.
4. **Agents are users too.** An agent that reads the docs must be able to install, configure, and fix errors without a human. That is measurable, so we measure it.
5. **The kill criteria do not move.** Leading indicators below are for steering only. Changing a criterion needs a superseding ADR.

## Human track

### Pre-launch (before 2026-10-13; the post and the target list are drafted, the upstream issues are open)

- **Build in public:** one blog post on the color-classification result (31,390 icons, 99.98% agreement with rendering, zero multicolor icons recolored). It works before any code ships, and it attracts the target user's symptom. Cross-post a short thread with one before/after image. It slipped past the launch and is published as a LinkedIn article plus an X thread (TSK-028).
- **Upstream first:** open fair, reproducible issues on @neodx/svg for what the TSK-007 spike found (Turbopack failure, SSR blanks, NFD ids). It builds goodwill and makes our comparison credible.
- **Target list:** about 20 public Next.js App Router repos or design systems with a custom SVG icon folder (GitHub code search: `next.config` plus `icons/*.svg`, or SVGR in the dependencies). Rank by fit: App Router, many icons, hardcoded colors, active maintainers.

### Launch (TSK-019)

- Blog post with the color result and the Turbopack comparison, linking the example (TSK-016) and comparison page (TSK-017).
- Submissions: r/nextjs, r/reactjs, This Week in React, Bytes, JavaScript Weekly, Bluesky/X, Hacker News "Show HN" only if the post stands on its numbers.
- Starter and template proposals (TSK-019 short list).

### Post-launch (12-week window)

- **Direct PRs** to the best-fit repos from the target list: migrate their icons, show the bundle and HTML size diff in the PR. A merged PR is a real user; a review discussion often brings issues from distinct external people.
- **Answer existing questions** on GitHub Discussions (vercel/next.js), Stack Overflow, and Reddit about SVG sprites in App Router or icons in Server Components. Answer the question first; mention svgworm only where it fits, and disclose authorship.
- **Fast response:** first reply to every issue within 48 hours. Early contributors decide whether to come back.

## Agent track

Agents find tools through docs they fetch, search results, and training data, and they succeed with tools that are easy to drive from a shell.

1. **Docs agents can fetch:** `llms.txt` and `llms-full.txt`, JSON Schema for the config, copy-pasteable examples (TSK-017, R-55).
2. **Context7:** submit the docs so agents that use Context7 get current svgworm usage instead of guessing.
3. **Agent skill:** ship a `SKILL.md` in the repo that teaches an agent to set up svgworm in a Next.js app, and list it in public skill registries. `svgworm init` can optionally add a short svgworm section to the project's `AGENTS.md`.
4. **CLI built to be driven (R-56):** every interactive flow has flags, `--json` output, stable exit codes, and every error message names the fix.
5. **Agent eval:** a scripted check that gives an agent a Next.js app plus a folder of SVGs and a task prompt, then verifies the result builds and icons render. Two scores:
   - **Guided success:** the agent is told to use svgworm. Measures docs and CLI quality, and runs as a docs regression check.
   - **Unprompted pick rate:** the agent is only asked to add icons. A lagging signal of search and training-data presence. Tracked, not targeted.

**Not doing:** an MCP server. Agents already run the CLI in a shell, so an MCP server would add maintenance without adding capability. Revisit if the agent eval shows a need.

## Metrics

| Metric | Kind | Source |
|--------|------|--------|
| Weekly npm downloads (4-week avg) | Kill criterion | api.npmjs.org |
| Distinct external issue/PR authors | Kill criterion | `gh` |
| Public starter or template adoption | Kill criterion | Manual |
| GitHub stars and traffic referrers | Leading | GitHub traffic API (14-day window, so snapshot weekly) |
| Target-list PRs opened / merged | Leading | Manual |
| Agent eval: guided success, unprompted pick rate | Leading | Agent eval script |

A weekly snapshot script (extending TSK-020) appends these to a log so the 12-week review has history, not one data point.

## Tasks

| Task | Track |
|------|-------|
| TSK-016 Next.js example | Both |
| TSK-017 Discovery docs and comparison | Both |
| TSK-019 Launch outreach | Human |
| TSK-020 Kill-criteria review | Metrics |
| TSK-028 Pre-launch post: per-icon color result | Human |
| TSK-029 Report TSK-007 findings upstream to @neodx/svg | Human |
| TSK-030 Target repo list and direct migration PRs | Human |
| TSK-031 Agent discoverability: Context7, skill, AGENTS.md snippet | Agent |
| TSK-032 Agent eval harness | Agent |
| TSK-033 Weekly traction metrics snapshot | Metrics |
