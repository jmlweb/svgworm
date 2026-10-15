---
id: TSK-081
title: name/case-folded: one warning per camelCase folder, not per file
status: pending
priority: P4
tags: [naming, cli, diagnostics]
created: 2026-10-15
source: TSK-064 review
depends-on: []
---

# name/case-folded: one warning per camelCase folder, not per file

## Description

ADR-0021's warning is emitted per file. A camelCase folder (SocialMedia/ with 200 icons) prints 200 near-identical warnings, the log spam cli.md says the plain output avoids. Report a camelCase folder segment once (file = the folder path, suggestion = the folder name), and keep per-file warnings for camelCase file names.

## Acceptance Criteria

- [ ] A camelCase folder gives one name/case-folded warning naming the folder and its suggested name, whatever its file count
- [ ] A camelCase file name still warns per file; a file under a camelCase folder warns for its own segment only
- [ ] Tests first in naming.test.ts / compile.test.ts; troubleshooting row still accurate; changeset patch

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created