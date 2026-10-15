# Target repositories for migration PRs

Public Next.js repos with their own SVG icon folder, for the direct-PR track of [traction.md](../traction.md) (TSK-030). v0.1.0 has been on npm since 2026-10-13, so the PRs can start. Each PR must show the diff in client JS and HTML size, answer the repo's own conventions, and disclose that we maintain svgworm.

Built on 2026-10-12. Re-run the queries before opening PRs: repos move, and some will have migrated or gone quiet.

## Queries (reproducible)

GitHub code search through `gh search code`, 30 results each, deduplicated by repository, forks and archived repos dropped:

```bash
gh search code --limit 30 '"@svgr/webpack" "next" filename:package.json' --json repository -q '.[] | .repository.nameWithOwner'
gh search code --limit 30 '"@svgr/webpack" filename:next.config.js'      --json repository -q '.[] | .repository.nameWithOwner'
gh search code --limit 30 '"@svgr/webpack" filename:next.config.ts'      --json repository -q '.[] | .repository.nameWithOwner'
gh search code --limit 30 '"@svgr/webpack" filename:next.config.mjs'     --json repository -q '.[] | .repository.nameWithOwner'
```

Why SVGR: a repo that configures `@svgr/webpack` in `next.config` owns its SVG files and ships them as JavaScript, which is the symptom svgworm removes. SVGR in `next.config` also breaks under Turbopack unless the repo added the `turbopack.rules` equivalent, so these teams have already felt the bundler-plugin cost.

Ranking data per repo came from `gh api repos/<repo>` (stars, last push, fork/archived) and the default-branch tree (`git/trees/<branch>?recursive=1`): count of `.svg` files whose path contains `icon`, and whether `app/**/layout|page.tsx` (App Router) or `pages/_app.*` (Pages Router) exists. Score: App Router first, then icon-SVG count, then activity and stars.

## Ranked list

Fit: **A** App Router with a real icon folder and recent activity. **B** App Router with few icons, or active Pages Router with many icons (a PR still works, the zero-client-JS story is weaker). **C** keep an eye on, no PR yet.

| # | Repo | Fit | Router | Icon SVGs | Stars | Last push | Notes |
|---|------|-----|--------|-----------|-------|-----------|-------|
| 1 | [liblaber/ai](https://github.com/liblaber/ai) | A | App | 49 | 337 | 2026-09 | Internal-tools builder, active, large icon set |
| 2 | [aws-samples/sample-client-for-amazon-bedrock](https://github.com/aws-samples/sample-client-for-amazon-bedrock) | A | App | 56 | 128 | 2026-07 | AWS sample; PR review may be slow but visible |
| 3 | [SoYoung210/craft](https://github.com/SoYoung210/craft) | A | App | 26 | 100 | 2026-09 | UI experiments, design-minded maintainer |
| 4 | [blockscout/chainscout](https://github.com/blockscout/chainscout) | A | App | 8 | 85 | 2026-10 | Very active, chain logos are multicolor: good color demo |
| 5 | [fullstacksjs/fullstacksjs](https://github.com/fullstacksjs/fullstacksjs) | A | App | 11 | 40 | 2026-09 | Community site, friendly to contributions |
| 6 | [EM-GeekLab/LLMOne](https://github.com/EM-GeekLab/LLMOne) | A | App | 7 | 89 | 2026-09 | Active product UI |
| 7 | [Producdevity/EmuReady](https://github.com/Producdevity/EmuReady) | A | App | 3 | 551 | 2026-10 | Few icons, but active and popular |
| 8 | [function03-labs/WalletLabels](https://github.com/function03-labs/WalletLabels) | B | App | 10 | 94 | 2025-02 | Quiet for a year |
| 9 | [JassinAlSafe/NothingCN](https://github.com/JassinAlSafe/NothingCN) | B | App | 11 | 14 | 2026-02 | Component showcase |
| 10 | [ilkhoeri/ui](https://github.com/ilkhoeri/ui) | B | App | 9 | 8 | 2026-07 | Component library |
| 11 | [jolbol1/JamesShopland.com](https://github.com/jolbol1/JamesShopland.com) | B | App | 7 | 30 | 2026-06 | Personal site |
| 12 | [Femoon/tts-azure-web](https://github.com/Femoon/tts-azure-web) | B | App | 2 | 476 | 2026-09 | Popular, almost no icons |
| 13 | [Enterwell/react-starter](https://github.com/Enterwell/react-starter) | B | App | 2 | 15 | 2026-10 | A **starter template**, but checked 2026-10-16: no icon imports to migrate (favicon URLs only, SVGR only in Storybook), no human commits since 2024-01. No PR |
| 14 | [PxlSyl/tailwind-nextjs-starter-blog-i18n](https://github.com/PxlSyl/tailwind-nextjs-starter-blog-i18n) | B | App | 1 | 187 | 2026-04 | A **starter template** (icons in `components/social-icons`) |
| 15 | [guildxyz/guild.xyz](https://github.com/guildxyz/guild.xyz) | B | App + Pages | 12 (465 svg) | 3,478 | 2025-11 | Big, mixed routers, many logos; PR would be large |
| 16 | [primefaces/primereact](https://github.com/primefaces/primereact) | B | Pages | 20 (119 svg) | 8,307 | 2026-09 | Docs site of a UI library; Pages Router |
| 17 | [Coding-Coach/find-a-mentor](https://github.com/Coding-Coach/find-a-mentor) | B | Pages | 11 | 752 | 2026-10 | Active community project |
| 18 | [eternalsafe/wallet](https://github.com/eternalsafe/wallet) | B | Pages | 7 (147 svg) | 161 | 2026-06 | Safe fork, many token logos (multicolor) |
| 19 | [teknologi-umum/blog](https://github.com/teknologi-umum/blog) | C | Pages | 8 | 24 | 2026-02 | Small blog |
| 20 | [smartcontractkit/blockchain-developer-hub](https://github.com/smartcontractkit/blockchain-developer-hub) | C | Pages | 38 | 90 | 2023-09 | Unmaintained since 2023 |

Checked and dropped (SVGR present but no icon folder, or inactive): tailwindlabs/tailwindcss.com (truncated tree, icons inline as components), jnsahaj/tweakcn (no icon SVGs), raphaelsalaja/userinterface-wiki (no SVGs), xizon/fullstack-nextjs-app-template (1 icon), APIs-guru/graphql-voyager (not Next), xforceai/ide and NoisyTrumpet/headless-wp-template (inactive).

## Before each PR

1. Confirm the repo is still active and has no open "icons" or "svg" PR.
2. Run the migration locally: `svgworm init --yes`, move or point `sources` at the icon folder, replace the SVGR imports with `<Icon name>`; keep their component API where it is exposed.
3. Measure before and after: `next build` output size of client chunks that contained icon code, and the HTML size of one page with icons. Put both numbers in the PR description.
4. One PR per repo, small, with the color classification result visible (a multicolor logo that still renders in color).
5. Log it in `docs/metrics/manual.json` (`targetListPrs`) so the weekly snapshot tracks it.

Starter templates (#13, #14) are the shortest path to the "one public starter or template" kill criterion. Open those first.
