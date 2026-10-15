# Traction metrics

Weekly snapshots of the leading indicators in [traction.md](../traction.md) and the three kill criteria of [ADR-0005](../adr/0005-build-standalone-with-kill-criteria.md). Steering only: the criteria do not move.

- `traction.jsonl`: one JSON row per snapshot, append-only. GitHub traffic only covers 14 days, so this file is the history.
- `manual.json`: what no API knows. `launchDate` is set (2026-10-13); add a starter or template to `starters` when one adopts svgworm, keep `targetListPrs` current (TSK-030), and add each published post to `posts` (draft path, date, channels). The snapshot script does not read `posts`; it is the publication record.
- `scripts/traction-snapshot.mjs`: takes a snapshot (`--dry-run` to only print), or prints the kill-criteria verdict with `--review`.
- `agent-eval.jsonl` and `manual.json` `agentEval`: written by `evals/agent/run.mjs` (see [evals/agent/README.md](../../evals/agent/README.md)).

The `Traction snapshot` workflow (`.github/workflows/traction.yml`) runs every Monday and commits the new row. Run it by hand with `gh workflow run traction.yml`, or locally with `node scripts/traction-snapshot.mjs` (needs `gh` logged in with push access for the traffic endpoints).

The 12-week review (TSK-020) is `launchDate + 84 days`. On that date run `node scripts/traction-snapshot.mjs --review` and write the continue-or-stop ADR from its output.
