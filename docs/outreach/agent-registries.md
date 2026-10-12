# Agent discoverability submissions (TSK-031)

What to submit, where, and the exact text. Both work best once `svgworm@0.1.0` is on npm, because Context7 and skill registries rank by what agents can install. The maintainer submits; nothing here publishes on its own.

## 1. Context7

Context7 indexes a public repository's docs so agents that use its MCP server get current usage instead of guesses.

1. Open <https://context7.com/add-library> (or the "Add library" button on context7.com) and submit `https://github.com/jmlweb/svgworm`.
2. The repo already has what the indexer prefers: `README.md` with copy-pasteable examples, `llms.txt`, `docs/` in Markdown, and a `skills/svgworm-nextjs/SKILL.md`. If the form asks for a docs folder, give `docs`; if it asks for a title, use `svgworm`.
3. Optional, if Context7 asks for a config: add `context7.json` at the repo root:

   ```json
   {
     "projectTitle": "svgworm",
     "description": "CLI that turns a folder of SVG files into type-safe, content-hashed SVG sprites with a React Server Component adapter (zero client JS).",
     "folders": ["docs", "skills", "examples/next-app-router"],
     "excludeFolders": ["docs/samples", "docs/metrics", "docs/outreach", "docs/posts", "spikes", ".backlog"],
     "rules": [
       "Run `svgworm init --yes` to set a project up non-interactively.",
       "Sprites must be same-origin; publicPath starts with / and includes the Next basePath.",
       "Use `svgworm check` in CI; it exits 1 when the committed output is stale."
     ]
   }
   ```

4. Verify after indexing: in an agent with the Context7 MCP server, run `resolve-library-id` for `svgworm`, then `query-docs` with "set up svgworm in a Next.js app". The answer must mention `svgworm init`, `createIcon(manifest)` and `svgworm check`. Record the date in TSK-031 (criterion 1).

## 2. Skill registries

The skill is `skills/svgworm-nextjs/SKILL.md` (Agent Skills format: frontmatter `name` and `description`, then instructions). Install path for users:

```bash
npx skills add jmlweb/svgworm --skill svgworm-nextjs
```

Submit it to at least one public registry (criterion 3):

| Registry | How | Text |
|----------|-----|------|
| skills.sh (Vercel's `skills` CLI directory) | The directory lists any public repo with a `skills/*/SKILL.md`; usage counts come from `npx skills add`. Nothing to submit; it appears once people install it. Link the install command from the README | n/a |
| awesome-agent-skills style lists (GitHub) | Open a PR adding one line under the frontend or tooling section | `- [svgworm-nextjs](https://github.com/jmlweb/svgworm/tree/main/skills/svgworm-nextjs) - Set up svgworm in a Next.js App Router app: SVG folder to a type-safe sprite rendered by a Server Component with zero client JS; fixes for every error code.` |
| Claude Code plugin marketplaces (`claude plugin marketplace add`) | Only if the maintainer wants a plugin wrapper; a plain skill is enough for the kill criteria | skip for now |

After listing, add the install command to the README "For AI agents" section and record the registry and date in TSK-031.

## 3. Already done

- `svgworm init --agents-md` appends a marked svgworm section to the project's `AGENTS.md` (criterion 4).
- `llms.txt`, the JSON Schema and the skill are linked from the README (TSK-017, criterion 2).
