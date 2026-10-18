# Agent workflow rules

Lessons from past agent sessions on this repo. They cover how to run the work, not what to build.

## Worktree subagents

A learning alone does not reach a subagent: worktree-guard refusals kept happening after LRN-021 was recorded. Paste this brief into every `isolation: worktree` prompt:

- Run one plain command per tool call. No `cd <dir> && …` or `;` chains: the worktree guard refuses commands it cannot prove stay inside the worktree.
- Call git as `/usr/bin/env git <cmd>`. Rewritten porcelain commands are refused (LRN-021).
- Run `pnpm install` first. `node_modules` and the husky commit-msg hook are per checkout.
- Check the base before working: the worktree must be on current `main` and contain `AGENTS.md` and `packages/`. Stop and report if not.
- Touch no file that a concurrent agent also touches. Tasks that change `src/core` or the output contract run serially in the main session.
- Restate the rules the task needs (test-first, Conventional Commits with a lowercase subject, no push, flowstate for the backlog). Subagents don't inherit them.

## flowstate CLI

- Pass full IDs: `TSK-008`, not `008` ("Entity not found").
- Under zsh, never store the command in a variable (`F="node …/flowstate.js"; $F …` exits 127, because zsh does not word-split). Use the full path or a shell function.
- The plugin cache path contains the version. Resolve the newest installed version each session; never hard-code or commit the path.
- No command rewords acceptance criteria. Edit the criterion text in the task file (never the index), then log the reason with `task-update <ID> --log -`.
- Another session may be editing `.backlog` at the same time. Re-read the index right before a change and commit backlog moves on their own.

## Gates by change type

Run these before committing, on top of the task's own tests. The commands are in AGENTS.md.

| Change touches | Run |
|----------------|-----|
| `src/core`, the output contract, or the adapters | `pnpm verify`, `pnpm determinism:fingerprint`, `pnpm example:check`, `pnpm example:vite:check`, `pnpm site:check`, `pnpm render:check` (the matrix diff must be empty or reviewed) |
| `src/cli` or `src/vite` only | `pnpm verify`, plus the example that exercises it |
| Generated component templates (`src/cli/init`) | `pnpm verify` (the conformance tests), `pnpm site:check` |
| `apps/site` only | `pnpm site:check` (no changeset: the site is private, LRN-035) |
| User docs, CLI help, or config | Keep `llms.txt`, both skills in `skills/`, and the site docs in sync; `pnpm schema:generate` when the zod schema changed |
| Toolchain or shared configs | `pnpm verify`, `pnpm typecheck:ts7` |

## Autonomous runs

When asked to work through the backlog without supervision:

- One commit per task, with backlog moves in their own commit.
- Push only with explicit permission. If the user says to push once at the end, keep every commit local until then.
- Block a task that needs the maintainer's accounts or a decision only they can make (publishing, posting, npmjs.com or GitHub settings) with `/flowstate:block-task` and a one-line reason, then move on.
- Never approve the `npm-publish` deployment unless the user asks for it in that session. Publishing is irreversible.
- Finish with a recap: commits, blocked tasks with reasons, deviations from the plan, and decisions the user should review.

## Outward actions

- Before posting a PR comment, review, issue or any other public text, show the exact title and body and get a yes for each action.
- Merging, deploying and editing CI workflows need the user's explicit request in the current turn.

## Library docs

- Context7 `resolve-library-id` takes both `libraryName` and `query`; a call without `query` fails validation.
