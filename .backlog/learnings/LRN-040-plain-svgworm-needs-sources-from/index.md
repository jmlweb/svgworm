---
id: LRN-040
title: Plain svgworm needs sources from a config file; manual setup docs must pass --source
status: active
tags: [docs, cli, config, onboarding]
task: TSK-047
created: 2026-10-15
---

## Context

TSK-047 rewrote the Next.js guide. The old manual steps built with `svgworm --source icons` once, then added `"predev": "svgworm"` and `"prebuild": "svgworm"` with no config file.

## Insight

`sources` is the only required config key. Plain `svgworm` with no `svgworm.config.json` and no `--source` exits 2. So the documented manual scripts were broken, and llms.txt had the same bug. `init` hides this because it writes the config file.

## Application

Any doc, skill or llms.txt line that shows plain `svgworm` must either come after `init` or a config file with `sources`, or pass `--source <dir>`. When you edit setup docs, check that each command in it can run alone.
