# 0021. No camelCase splitting in icon names; warn when letter case carried meaning

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-064
- **Resolves:** Q-31 (re-examined after dogfooding)

## Context

[ADR-0007](0007-icon-naming-and-collision-policy.md) derives the public name from the file path: segments are NFC-normalized and lower-cased, every run of punctuation becomes one `-`, and letter case is never split. `ArrowRight.svg` is `arrowright`. Dogfooding 0.2.1 (TSK-064) showed the cost: Figma and many design tools export PascalCase names, so a user who drops `ArrowRight.svg` in the folder gets an icon called `arrowright`, hard to guess and unlike the `arrow-right` every icon set uses. The question is whether to change the rule, which renames icons for everyone (a breaking change to the output contract), or to keep it and make the loss visible.

## Options considered

1. **Split camelCase** at a lowercase-to-uppercase boundary (`ArrowRight` → `arrow-right`), as lodash `kebabCase` does.
   - Pros: the name designers expect; no renaming of files.
   - Cons: the name then depends on letter case, and letter case is the one thing git does not keep reliably on macOS and Windows. With `core.ignorecase` (the default on case-insensitive file systems) a case-only rename, `Arrowright.svg` → `ArrowRight.svg`, is not recorded: the working tree says `arrow-right`, the committed tree says `arrowright`, and CI (Linux) builds a different manifest than the developer. That is a determinism failure of the kind ADR-0007 was written to prevent, and it surfaces as `svgworm check` failing only in CI. Acronyms are guesswork too (`SVGIcon`, `iOS`, `HTMLElement`). Rejected again, for the same reason as in ADR-0007.
2. **Opt-in splitting** behind a config key.
   - Cons: the same non-determinism, now hidden behind a flag, and a second naming contract to document, type and test. Rejected.
3. **Keep the rule and warn.** When a path segment has a lowercase letter followed by an uppercase one, the build emits a `name/case-folded` warning that names the file, the name it got, and the file name that would give the readable one. The name itself does not change.
   - Pros: deterministic names stay; the user sees the problem at the first build, with the fix; renaming a file is a one-time cost. Fits principle 5 (fail loudly, never rename silently).
   - Cons: a warning on every build until the file is renamed. That is the point.

## Decision

- Names are unchanged: no camelCase splitting, as ADR-0007 decided. `ArrowRight.svg` stays `arrowright`.
- A new warning, `name/case-folded`, is emitted for every file or folder segment where a lowercase letter is followed by an uppercase letter. The message gives the derived name and the suggested path (`arrow-right.svg`), which is the segment with `-` inserted at those boundaries and then normalized as usual. It is a warning: the build succeeds and the output is unchanged.
- The docs state the rule where users look for it: the naming section of "How it works", the troubleshooting table, and the agent skills' error tables.

## Evidence

- ADR-0007's reasoning and its spike ([TSK-006](../../spikes/TSK-006-icon-naming/RESULTS.md)) on case-only renames and `core.ignorecase`.
- TSK-064 dogfooding: PascalCase exports are common enough that the silent `arrowright` was reported as a bug.
- `naming.test.ts` and `compile.test.ts` cover the warning: `ArrowLeft.svg` suggests `arrow-left.svg`, `SocialMedia/x.svg` suggests `social-media/x.svg` (only the kept segment with `flatten`), `IC_Close.SVG`, `HOME.svg`, `ΟΔΟΣ.ΚΑΤΩ.svg` and `home.svg` warn nothing, the suggested path always derives the promised name and warns nothing itself, and the fixture corpus (no camelCase file) still builds with its one `viewbox/derived` warning.

## Consequences

- No output change; no renamed icons; a new diagnostic code in the public set (changeset, minor).
- Users who want `arrow-right` rename the file once, guided by the warning. A future alias map (TSK-025) could map names without touching files, which would also cover this case.
