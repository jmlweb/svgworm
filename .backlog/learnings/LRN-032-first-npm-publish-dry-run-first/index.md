---
id: LRN-032
title: First npm publish: dry-run first, expect staging, bin paths without ./
status: active
tags: [release, npm, publishing, cli, bin]
task: TSK-018
created: 2026-10-12
---

## Context

Publishing svgworm 0.1.0 and @svgworm/react 0.1.0 by hand on 2026-10-13 (first publish, before trusted publishing could be configured).

## Insight

- **npm 11.6 silently drops a `bin` entry whose path starts with `./`.** `npm publish` printed `"bin[svgworm]" script name bin/svgworm.js was invalid and removed` as a warning and would have shipped the CLI package without its command. publint and attw did not flag it. The first attempt only failed because the one-time code was missing, which is what gave us the chance to read the warning.
- **The registry stages the first publish of a new package.** With a plain `npm publish` from npm 11.6.2 (no `npm stage` command there), `svgworm` landed as a public placeholder `0.0.0-stage` ("Temporary package placeholder for staged publishing") and the real 0.1.0 waited for 2FA approval on npmjs.com. `@svgworm/react` went live directly a few minutes later, so the behavior is per package and not predictable from the client. `npm view` on the placeholder shows no `bin` and version `0.0.0-stage`, which looks like a broken publish if you do not know about staging.
- **A non-interactive shell cannot answer the OTP prompt.** Publish from a real terminal, or pass `--otp=<code>`.
- **Renaming GitHub branches in one chained command is fragile.** `POST /branches/next/rename` to `main` failed with "New branch already exists" right after `main` had been renamed away, and the chain's later `git push origin main` created a stray `main` from the old local branch. Rename, verify with `git ls-remote`, then push.

## Application

- Before any publish: `npm publish --dry-run` and read every `npm warn publish` line; `npm pkg fix` shows what npm would change. Keep `bin` paths as `bin/<name>.js`.
- Expect a `0.0.0-stage` placeholder on a brand-new package; approve the staged version on npmjs.com (or `npm stage approve` with npm ≥ 11.15), then verify with `npm view <pkg> versions dist-tags bin`.
- Smoke test the published tarballs from a clean folder (install, `init --yes`, build, `check`) before announcing.
- Do GitHub branch renames as separate steps and re-check `git ls-remote --heads` between them.
