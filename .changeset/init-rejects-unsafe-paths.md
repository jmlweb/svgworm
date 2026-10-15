---
'svgworm': patch
---

`svgworm init` now rejects a `--config`, `--source`, `--out-dir`, `--module-dir` or `--component-file` path with spaces or shell characters (`$ & | ; < > ( ) * ? # ! ~`), as it already did for quotes. Those paths are written unquoted into the `package.json` scripts and the printed commands, so `init --config "my icons.json"` used to produce a script that failed with `unknown command "icons.json"`.
