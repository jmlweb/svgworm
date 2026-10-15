---
id: RPT-007
title: First-run friction found migrating a real Next.js starter: init errors, Illustrator styles, lint, React 19 peer
type: improvement
severity: medium
status: triaged
created: 2026-10-15
triaged: 2026-10-15
task-id: TSK-095
---

## Current behavior

Found on 2026-10-16 while migrating Enterwell/react-starter (Next 14.0.3, React 18.2.0, ESLint max-len 100) with svgworm@0.4.0 in a scratch clone (TSK-030). Nothing was published. Each item stops or confuses a first-time user:

1. `npx svgworm init --yes --source public/icons` exits 2 with `svgworm: the config would be invalid: outDir: "public/icons" is inside a source folder, so the next build would read the sprites as icons`. The message gives no fix (pass `--out-dir`, or move the icons out of `public/`), and nextjs.md doesn't cover it. Next.js users commonly keep icons in `public/icons`.
2. `npx svgworm init --yes` on two Adobe Illustrator logos exits 1 with `error [style/leftover] icons/logo.svg: <style> has rules that cannot be inlined (such as :hover), and a raw <style> leaks between icons in a sprite`. The file has no `:hover`. It has 37 class rules and uses only `.st10`, so the leftovers are unused selectors. The message names no selector. Unused rules are harmless and could be dropped. Illustrator exports often look like this.
3. The generated `components/icon.tsx` breaks `next build` in repos with ESLint `max-len` 100: `./components/icon.tsx 5:1 Error: This line has a comment length of 110. Maximum allowed is 100. max-len`. The template should pass common lint rules.
4. `@svgworm/react@0.4.0` declares `react ^19.0.0`. On React 18.2.0, pnpm only warns (`unmet peer react@^19.0.0: found 18.2.0`). nextjs.md doesn't state the React 19 requirement; only packages/react/README.md does. Next 14 apps on React 18 are still common.

## Proposed change

1. Make the outDir-in-source error name the fix (`--out-dir <dir>` or move the sources out of `public/`), and add it to troubleshooting.
2. Drop `<style>` rules whose selectors match nothing before the leftover check. If rules still remain, list the selectors that are left instead of the generic `:hover` example.
3. Keep every generated template line within 80 columns, and add a test for it.
4. State the React requirement in nextjs.md and init output. Or decide (ADR if it widens the support range) whether React 18 support is worth it, given principle 8.

## Expected benefit

Each item is a point where a first-time user on a real project stops. Adoption is the main risk until 2027-01-05, so first-run friction costs more than features do.
