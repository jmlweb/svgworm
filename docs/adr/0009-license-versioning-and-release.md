# 0009. License, versioning, and release tooling

- **Status:** proposed (the license needs the maintainer's confirmation; it becomes accepted once confirmed)
- **Date:** 2026-10-08
- **Task:** TSK-009
- **Resolves:** Q-51

## Context

svgworm is an open-source npm package whose success is measured by adoption ([ADR-0005](0005-build-standalone-with-kill-criteria.md) kill criteria). [ADR-0008](0008-tech-stack-and-package-layout.md) makes it two published packages: `svgworm` and `@svgworm/react`. Before v0.1.0 (TSK-018) we need:

- a license and contribution policy (Q-51);
- a versioning scheme;
- a release pipeline that publishes with npm provenance and without long-lived tokens.

## Options considered

### License

1. **MIT.** Short, permissive, and understood by every corporate legal checklist. It is what the ecosystem we build on and compete with uses: svgo, zod, @clack/prompts, React, Next.js, and @neodx/svg are all MIT. No adoption friction. It has no explicit patent grant. Chosen.
2. **Apache-2.0.** Permissive, with an explicit patent grant and patent-retaliation clause. Its NOTICE and change-marking duties are heavier for redistributors, and it is less common in this ecosystem. We see little patent risk in an SVG build tool.
3. **MPL-2.0, or a copyleft license (LGPL, GPL).** Copyleft on a build tool scares corporate users away for no benefit to us. That conflicts with the adoption goal.

### Contribution policy

1. **Inbound = outbound under the project license, with no CLA.** Contributors license their changes under MIT just by submitting them (GitHub ToS §D.6). No bot and no friction for first-time contributors, who count toward the "≥ 5 distinct external people" kill criterion. Chosen.
2. **DCO sign-off (`Signed-off-by`).** Light, but it fails PRs from people who don't know about it. That is friction where we most want contributions.
3. **CLA.** Only useful if we might relicense. We have no such plan.

### Versioning and changelog

1. **Changesets 3.** Chosen.
   - Each PR adds a changeset that states the bump and the user-facing note.
   - The action opens a "Version Packages" PR that bumps versions and writes `CHANGELOG.md` per package.
   - It is monorepo-aware and supports `fixed` groups.
2. **semantic-release / release-please.** Both derive versions from commit messages. Workable, since we already use Conventional Commits, but a commit message is a poor place to write the user-facing note for a public output contract. release-please's monorepo setup is also heavier.
3. **Manual `npm version`.** Error-prone with two packages that have to move together.

### Publishing

1. **GitHub Actions + npm trusted publishing (OIDC).** No stored npm token. npm generates provenance automatically for a public package published from a public repository. Chosen.
2. **Automation token + `--provenance`.** Works, but it is a long-lived secret that npm itself is pushing projects away from.
3. **Publishing from a laptop.** No provenance, and it is not reproducible.

## Decision

- **License: MIT** for every published package and the repository. `LICENSE` lives at the repo root and is copied into each package (TSK-010). `"license": "MIT"` goes in every `package.json`. Fixtures keep their own OSS licenses, recorded in `fixtures/LICENSES.md`, and are never published to npm.
- **Contributions:** inbound = outbound under MIT, with no CLA and no DCO. A short `CONTRIBUTING.md` (TSK-010 or TSK-017) states this, points to `AGENTS.md`, and asks for a changeset on user-facing changes.
- **Versioning:** SemVer.
  - During **0.x**, a breaking change to the CLI, the config, or the output contract is a **minor** bump with a "Breaking" note in the changeset. A fix or feature is a patch (TSK-014).
  - `1.0.0` comes when the output contract is declared stable. That needs its own ADR.
  - `svgworm` and `@svgworm/react` form a Changesets **`fixed`** group, so they always share a version. A user can then read adapter compatibility from the version number alone.
- **Release flow:**
  1. PRs carry `.changeset/*.md` files.
  2. On `next` (the default branch once it replaces `main`), `changesets/action` keeps a "Version Packages" PR open.
  3. Merging that PR runs the publish job: GitHub-hosted runner, `permissions: id-token: write`, npm CLI ≥ 11.5.1 (installed explicitly if the runner's npm is older), and Node ≥ 22.14 (an npm requirement). The job publishes via trusted publishing, then creates a GitHub release with the changelog.
  4. Pre-releases use the `next` dist-tag (Changesets pre mode).
- **Provenance:** relies on trusted publishing's automatic attestation, and the publish command also passes `--provenance` explicitly. It costs nothing, and community reports say the automatic path hasn't always produced the attestation. TSK-018 verifies the npm "Provenance" badge on the first release, links it to the workflow run, and then disables token-based publishing on both packages.

## Evidence

- **npm trusted publishing** ([docs.npmjs.com/trusted-publishers](https://docs.npmjs.com/trusted-publishers), read 2026-10-08):
  - it "requires npm CLI version 11.5.1 or later and Node version 22.14.0 or higher";
  - it is supported on GitHub-hosted Actions runners, GitLab.com shared runners, and CircleCI cloud;
  - provenance is automatic for GitHub Actions and GitLab "by default—you don't need to add the `--provenance` flag", but only for a public package published from a public repository;
  - GA since 2025-07-31 ([GitHub changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)).
- **The repository is public** (<https://github.com/jmlweb/svgworm>, [traction.md](../traction.md)), so the provenance condition holds.
- **Current versions** on npm (2026-10-08): `@changesets/cli` 3.0.3 (published 2026-09-14, engines `^22.11 || ^24 || >=26`) and `npm` 12.2.0.
- **Licenses of the stack** (npm registry): svgo, zod, @clack/prompts, chokidar, and commander are all MIT. The direct competitor @neodx/svg is MIT ([viability.md](../viability.md)).
- **Names:** `svgworm` and `@svgworm/react` return 404 on the npm registry (2026-10-08), so neither is taken. Whether the `@svgworm` scope is free can only be checked by creating the npm org.
- **Not verified:** whether `pnpm publish` uses npm's OIDC flow. The npm docs only name `npm publish`. A community guide says a package must already exist on npm before a trusted publisher can be configured for it. Both are open items for TSK-018 (see Consequences).

## Consequences

- **Before TSK-018:**
  - create the `svgworm` npm org (for the `@svgworm` scope);
  - make the first publish of each package, if npm still requires the package to exist before a trusted publisher can be configured (manual `0.0.0` placeholder with 2FA, or `npm trust` if it supports pending publishers by then);
  - configure the trusted publisher for both packages, pointing at the release workflow file.
- **Publish command:** in the release job, Changesets' publish step must run with an npm CLI that supports OIDC. If `pnpm publish` turns out not to use OIDC, publish each packed tarball with `npm publish` instead (`pnpm pack`, then `npm publish <tgz>`, which keeps `workspace:` protocol rewriting).
- **Every user-facing PR needs a changeset.** CI warns when one is missing (TSK-010).
- **Once confirmed:** this ADR becomes `accepted`, and Q-51 is marked ✅. If the maintainer prefers Apache-2.0, only the license section changes, and nothing else in this ADR depends on it.
