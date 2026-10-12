---
id: LRN-031
title: Validate SVG by local name and review 'done' code before a release
status: active
tags: [security, svg, validation, review, cli, watch, fs]
task: 
created: 2026-10-12
---

## Context

On 2026-10-13, after the v0.1 feature work was complete and CI was green on every OS, a fresh-context code review and a security review of the session diff (`c0de909..HEAD`, 174 files) found 24 defects. The worst ones were in code that had tests and snapshots.

## Insight

- **A denylist that compares qualified names misses the prefixed form.** `validateTree` rejected `element.name === 'script'`, but `<x:script xmlns:x="http://www.w3.org/2000/svg">` is a script to the browser and svgo keeps prefixed elements (`removeUnknownsAndDefaults` skips them). The script reached the served sprite: a stored XSS when the hashed sprite URL is opened as a document. The same class: CSS escapes (`\75rl(` is `url(`), whitespace inside a scheme (`java\tscript:`), SMIL retargeting `href`, `data:image/svg+xml` hrefs.
- **Plain `writeFile` follows symlinks.** A cloned repo can ship `svgworm/icons.js -> ~/.ssh/config`; `predev` then runs `svgworm` and overwrites it. Temp file + `rename` fixes it (the link is replaced, not followed) and makes writes atomic for free.
- **Path flags are attacker input when agents drive the CLI.** `init --component-file ../x` wrote outside the project.
- **Lifecycle bugs hide behind passing happy-path tests.** `watch` attached watchers after the first build (edits during it were lost), could rebuild after Ctrl+C, and swallowed watcher errors; `main.ts` installed a SIGINT handler that only `watch` consumed, so Ctrl+C on `build` did nothing.

## Application

- When a validator rejects by name or pattern, ask what the consumer (browser, svgo, shell) does with the prefixed, escaped, whitespace-padded and `data:` variants, and test each one. Match on the local name (`name.slice(name.lastIndexOf(':') + 1).toLowerCase()`), decode CSS escapes before scanning, strip `[\s\x00-\x1f]` before scheme checks.
- Never write a generated file with a bare `writeFile`: temp file in the same folder, `wx`, then `rename`. Skip the write when the bytes are equal (keeps dev-server watchers quiet).
- Confine every CLI path option to the project root and reject quotes, backticks and line breaks before interpolating it into generated code or Markdown.
- For anything with start/stop state (watchers, timers, signals), test: event during the first run, stop while a run is in flight, and the error path of the resource itself.
- Before declaring a release-ready milestone, run `code-reviewer` and `security-reviewer` agents on the whole session diff, even when CI is green. They cost minutes and found what weeks of tests did not.
