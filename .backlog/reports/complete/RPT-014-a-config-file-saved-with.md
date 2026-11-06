---
id: RPT-014
title: A config file saved with a UTF-8 BOM is rejected as not valid JSON
type: bug
severity: low
status: triaged
created: 2026-11-06
triaged: 2026-11-06
task-id: TSK-108
---

## Observed

`readConfigFile` in `packages/svgworm/src/core/config/resolve.ts:208` reads the file with `readFile(path, 'utf8')`, which keeps a leading U+FEFF, and passes it to `JSON.parse` at line 219. `JSON.parse` rejects the BOM, so the catch turns it into "svgworm.config.json is not valid JSON". Windows tools still write a BOM (Windows PowerShell 5.1 `Set-Content -Encoding UTF8` / `Out-File`, editors set to "UTF-8 with BOM"), and the JSON text is otherwise valid. tsc and npm accept such files.

## Reproduction (main d78c9d2, after `pnpm build`)

```
mkdir -p /tmp/p/icons && cd /tmp/p
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24z"/></svg>' > icons/a.svg
printf '\xef\xbb\xbf{"sources":["icons"]}' > svgworm.config.json
node <repo>/packages/svgworm/bin/svgworm.js build
# svgworm: svgworm.config.json is not valid JSON   (exit 2)
```

Without the three BOM bytes the same file builds.

## Expected

Strip one leading U+FEFF before `JSON.parse` (RFC 8259 section 8.1 allows a parser to ignore it), with a test in `packages/svgworm/src/core/config/resolve.test.ts`. The error for real invalid JSON could also carry the `JSON.parse` message, so the user sees where it fails.
