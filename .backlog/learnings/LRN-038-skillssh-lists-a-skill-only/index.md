---
id: LRN-038
title: skills.sh lists a skill only after an install and an index crawl
status: active
tags: [agents, discovery, skills, traction]
task: TSK-031
created: 2026-10-15
---

## Context
TSK-031 needed svgworm-nextjs listed in a public skill registry. skills.sh has no submit form.

## Insight
skills.sh lists a skill only after someone runs `npx skills add <owner>/<repo>` and its Algolia index refreshes. The search API (https://skills.sh/api/search?q=<name>) returned 0 for about a day after the first install, then listed jmlweb/svgworm/svgworm-nextjs. A skill added to the repo later (svgworm-astro) is not picked up with the existing one: it needs its own install and crawl.

## Application
After adding a skill, run `npx skills add jmlweb/svgworm` once from a throwaway directory, outside the repo, and pick the new skill. Expect about a day of lag. Verify with the search API, not the website.
