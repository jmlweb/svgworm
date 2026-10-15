# Agent eval harness

Measures whether an AI agent can set svgworm up from the docs alone (TSK-032, [traction.md](../../docs/traction.md) "Agent eval"). Two scores:

- **Guided success** (`--mode guided`): the agent is told to use svgworm. Pass means the app builds, every icon is in the prerendered page through the sprite, and no icon code reaches a client chunk. This is a docs and CLI regression check: a drop means the README, `llms.txt` or the skill got worse.
- **Unprompted pick rate** (`--mode unprompted`): the agent is only asked to add icons. The run records which tool it picked (`svgworm`, `@svgr/webpack`, `lucide-react`, …) and whether its result builds. A lagging signal of search and training-data presence. Tracked, not targeted.

## Run

Needs Claude Code (`claude`) logged in, pnpm, and `pnpm build` in this repo for `--local`.

```bash
node evals/agent/run.mjs --mode guided --local      # evaluate unreleased local changes
node evals/agent/run.mjs --mode unprompted --local
node evals/agent/run.mjs --mode guided              # against the published packages
```

Each run costs API tokens (default cap `--budget 3` USD, `--max-turns 40`). The agent runs in a temp copy of `fixture/` with a limited tool set (file edits, `pnpm`, `npx`, `node`, `WebFetch`). `--keep` leaves the folder for inspection; `--dry-run` prepares it without starting the agent.

Results append to `docs/metrics/agent-eval.jsonl` and the latest pass/tool per mode goes into `docs/metrics/manual.json` (`agentEval`), which the weekly traction snapshot includes.

## Fixture

`fixture/` is a Next.js 16 App Router app with eight icons in `icons/` (repo fixtures, see `fixtures/LICENSES.md`), a page with the slots the icons belong in, and a README that says where the icons are. The prompts in `prompts/` ask for the same outcome with and without naming svgworm.

`check.mjs` can score any app folder by hand: `node evals/agent/check.mjs <dir>`.
