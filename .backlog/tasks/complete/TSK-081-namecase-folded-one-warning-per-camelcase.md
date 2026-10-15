---
id: TSK-081
title: name/case-folded: one warning per camelCase folder, not per file
status: complete
priority: P4
tags: [naming, cli, diagnostics]
created: 2026-10-15
source: TSK-064 review
depends-on: []
started: 2026-10-15
completed: 2026-10-15
---

# name/case-folded: one warning per camelCase folder, not per file

## Description

ADR-0021's warning is emitted per file. A camelCase folder (SocialMedia/ with 200 icons) prints 200 near-identical warnings, the log spam cli.md says the plain output avoids. Report a camelCase folder segment once (file = the folder path, suggestion = the folder name), and keep per-file warnings for camelCase file names.

## Acceptance Criteria

- [x] A camelCase folder gives one name/case-folded warning naming the folder and its suggested name, whatever its file count — evidence: compile.test.ts: warns once per camelCase folder (2026-10-15)
- [x] A camelCase file name still warns per file; a file under a camelCase folder warns for its own segment only — evidence: naming.test.ts: folder and file reported separately (2026-10-15)
- [x] Tests first in naming.test.ts / compile.test.ts; troubleshooting row still accurate; changeset patch — evidence: pnpm verify exit 0; .changeset/case-folded-warning.md updated (2026-10-15)

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created
- [2026-10-15] Started
- [2026-10-15] caseFoldedSegments in core/naming.ts returns file and folder segments separately; compile.ts reports each camelCase folder once (file = the folder path) and file names per file. Tests first (naming.test.ts, compile.test.ts: 3 files in SocialMedia/ give 2 warnings). Folded into the unreleased case-folded changeset (no new changeset); troubleshooting row updated. ADR-0021's Evidence bullet quotes the earlier per-file message; the decision text (per file or folder segment) still holds, so the accepted ADR is left as is. verify and determinism green.
- [2026-10-15] Completed