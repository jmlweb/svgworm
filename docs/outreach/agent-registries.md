# Agent discoverability submissions (TSK-031)

What to submit, where, and the exact text. `svgworm@0.1.0` has been on npm since 2026-10-13, which both need, because Context7 and skill registries rank by what agents can install. The maintainer submits; nothing here publishes on its own.

## 1. Context7

Context7 indexes a public repository's docs so agents that use its MCP server get current usage instead of guesses.

1. Open <https://context7.com/add-library> (or the "Add library" button on context7.com) and submit `https://github.com/jmlweb/svgworm`.
2. The repo already has what the indexer prefers: `README.md` with copy-pasteable examples, `llms.txt`, `docs/` in Markdown, and a `skills/svgworm-nextjs/SKILL.md`. If the form asks for a docs folder, give `docs`; if it asks for a title, use `svgworm`.
3. `context7.json` at the repo root ([schema](https://context7.com/docs/library-owners.md)) is committed. It limits indexing to the user-facing docs (`docs` without ADRs, metrics, outreach, posts and samples; `skills`; the Next.js example; the package READMEs), excludes contributor files such as `AGENTS.md` and the changelogs, and gives agents five usage rules. Context7 reviews `projectTitle` and `description` before using them and rejects promotional text, so keep both factual. As of 2026-10-14, `resolve-library-id svgworm` finds nothing: the library is not submitted yet.
4. Verify after indexing: in an agent with the Context7 MCP server, run `resolve-library-id` for `svgworm`, then `query-docs` with "set up svgworm in a Next.js app". The answer must mention `svgworm init`, `createIcon(manifest)` and `svgworm check`. Record the date in TSK-031 (criterion 1).

## 2. Skill registries

The skill is `skills/svgworm-nextjs/SKILL.md` (Agent Skills format: frontmatter `name` and `description`, then instructions). Install path for users:

```bash
npx skills add jmlweb/svgworm --skill svgworm-nextjs
```

Registries checked on 2026-10-14 (criterion 3):

| Registry | How it lists a skill | Fits now? |
|----------|----------------------|-----------|
| [skills.sh](https://skills.sh) (Vercel's `skills` CLI directory) | No submission. A skill appears in `npx skills find` once someone installs it with `npx skills add` (listed skills with 2 installs show up). `npx skills add jmlweb/svgworm --list` already finds `svgworm-nextjs`; `npx skills find svgworm` returns nothing yet | Yes: one real install lists it |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (~36k stars) | PR titled `Add skill: jmlweb/svgworm-nextjs`, one line at the end of the matching Community Skills subcategory, description of 10 words or fewer | Not yet: its CONTRIBUTING rejects brand-new skills without community usage |
| [JackyST0/awesome-agent-skills](https://github.com/JackyST0/awesome-agent-skills) | PR updating `README.md` and `README_ZH.md` | Not yet: needs 64 GitHub stars for community entries |
| [heilcheng/awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills) | PR to `README.md`, no usage bar | Low value: no push since 2026-04 |
| Claude Code plugin marketplaces | A plugin wrapper | Skip; a plain skill is enough for the kill criteria |

Listing on skills.sh: run the install once in a throwaway directory (it registers the install; the skill files land in that directory only):

```bash
cd "$(mktemp -d)" && npx skills add jmlweb/svgworm --skill svgworm-nextjs
```

Then `npx skills find svgworm` should list `jmlweb/svgworm@svgworm-nextjs`. Skill installs are not a traction metric, so the maintainer's own install does not distort the kill-criteria review.

Line for VoltAgent once the skill has users (10 words or fewer):

```markdown
- **[jmlweb/svgworm-nextjs](https://github.com/jmlweb/svgworm/tree/main/skills/svgworm-nextjs)** - Type-safe SVG sprite icons in Next.js, zero client JS
```

The install command is in the README "For AI agents" section and in `llms.txt`. After listing, record the registry and date in TSK-031.

## 3. Already done

- `svgworm init --agents-md` appends a marked svgworm section to the project's `AGENTS.md` (criterion 4).
- `llms.txt`, the JSON Schema and the skill are linked from the README (TSK-017, criterion 2).
