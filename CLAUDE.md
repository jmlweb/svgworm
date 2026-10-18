@AGENTS.md

## Claude-specific

- Project rules in `.claude/rules/` load automatically: `architecture.md`, `decisions.md`, `testing.md`, `agent-workflow.md` (worktree subagent brief, flowstate CLI, gates by change type, autonomous runs), `docs-and-site.md` (public text and site).
- Spikes and ADRs are reasoning-heavy, so prefer `opus` for them. Use `sonnet` for implementation and `haiku` for search.
- Useful skills:
  - `flowstate:*` for all backlog operations
  - `agent-skills:spec-driven-development` before a large feature
  - `agent-skills:documentation-and-adrs` when writing ADRs
  - `agent-skills:doubt-driven-development` for output-contract changes (it's a public API)
  - the Context7 MCP tools (`resolve-library-id`, `query-docs`) before relying on any library's API
- Independent spikes can run in parallel with `/flowstate:parallel` (worktree isolation). Include the worktree subagent brief from `.claude/rules/agent-workflow.md` in each agent prompt.
