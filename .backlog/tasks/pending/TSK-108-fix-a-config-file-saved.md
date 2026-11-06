---
id: TSK-108
title: Fix: A config file saved with a UTF-8 BOM is rejected as not valid JSON
status: pending
priority: P4
tags: []
created: 2026-11-06
source: report/RPT-014
depends-on: []
---

# Fix: A config file saved with a UTF-8 BOM is rejected as not valid JSON

## Description

`readConfigFile` in `packages/svgworm/src/core/config/resolve.ts:208` reads the config with `readFile(path, 'utf8')`, which keeps a leading U+FEFF, and `JSON.parse` at line 219 rejects it, so a BOM-prefixed but valid config fails with "svgworm.config.json is not valid JSON". Windows PowerShell 5.1 and some editors write that BOM. Strip one leading U+FEFF before parsing (RFC 8259 section 8.1). Reproduction in RPT-014. Start with a failing test. Gate: `pnpm verify`.

## Acceptance Criteria

- [ ] A test in packages/svgworm/src/core/config/resolve.test.ts loads a config file that starts with a UTF-8 BOM and gets the same config as without it
- [ ] Real invalid JSON still fails with a ConfigError that names the file
- [ ] A changeset records the fix

## Notes

## Learnings

## Progress Log

- [2026-11-06] Created