# Releasing

How a version of `svgworm` and `@svgworm/react` reaches npm. Decided in [ADR-0009](adr/0009-license-versioning-and-release.md); this page is the checklist. The two packages are a Changesets `fixed` group, so they always share a version.

## Every change

1. User-facing change: `pnpm changeset`, pick the bump (during 0.x a breaking change is a **minor** with a "Breaking" note; fixes and features are patches or minors as the changeset says), write the note for the changelog, commit the file.
2. CI (`.github/workflows/ci.yml`) warns when a PR has no changeset.

## Every release

The `Release` workflow (`.github/workflows/release.yml`) runs on every push to `main`, in three jobs:

- **check** builds, type-checks, tests and runs `check:packages` with a read-only token, then counts the pending changesets.
- **version** (pending changesets) opens or updates the **"chore(release): version packages"** PR. That PR bumps both `package.json` versions, writes `CHANGELOG.md` per package and deletes the changesets. Review the changelog like code.
- **publish** (no pending changesets, so right after that PR is merged) runs inside the **`npm-publish` GitHub environment**: it waits until the maintainer approves the deployment (Actions → the run → *Review deployments*), and only `main` may deploy to it. It is the only job with `id-token: write`. It publishes both packages with `pnpm changeset publish` through **npm trusted publishing** (OIDC, no token in the repo), tags `svgworm@x.y.z` and `@svgworm/react@x.y.z`, and creates the GitHub releases from the changelog. A run with nothing new to publish is a no-op, so approving it is harmless; rejecting it is how to hold a release.

The environment was created on 2026-10-13 (`gh api PUT repos/jmlweb/svgworm/environments/npm-publish`, required reviewer `jmlweb`, custom branch policy `main`). Recreate it with the same name if the repo is moved.

Branches: `main` is the default branch and the only release branch since 2026-10-13, when the rewrite branch `next` was renamed to `main` and the old prototype moved from `main` to `prototype` (ADR-0003, ADR-0009). A clone from before that day needs `git fetch --prune && git switch main`.

After it finishes:

1. Open each package on npmjs.com and confirm the **Provenance** badge links to the workflow run.
2. Smoke test from a clean folder: `pnpm add -D svgworm@x.y.z @svgworm/react@x.y.z`, run `svgworm init --yes`, `svgworm`, and build the Next.js example against the published versions.
3. Check real Safari and iOS by hand on the example (Playwright's WebKit is not Safari; `testing.md`).

## One-time setup (maintainer, needs npm login)

Status on 2026-10-13: steps 1, 2 and 5 are done (org created, both packages published by hand at 0.1.0 and approved out of npm's staging, launch date recorded). Steps 3 and 4 are still open; until they are done, the publish job will fail at `npm publish` and the next release needs a manual publish again.

Lessons from the first publish (LRN-032): run `npm publish --dry-run` first and read every `npm warn publish` line (npm 11.6 dropped a `bin` path that started with `./`); a brand-new package may be staged by the registry, which shows up as a public `0.0.0-stage` placeholder until the real version is approved on npmjs.com with 2FA; and a shell that cannot prompt needs `--otp=<code>`.

Trusted publishing is configured per package on npmjs.com, and the form lives on an existing package's settings page, so the order is:

1. **Create the npm org `svgworm`** so the `@svgworm` scope exists.
2. **First publish by hand**, once, with 2FA, so both packages exist:
   ```bash
   pnpm build && pnpm check:packages
   cd packages/svgworm && npm publish --access public --provenance=false
   cd ../react && npm publish --access public --provenance=false
   ```
   Do this with the real `0.1.0` versions (merge the version PR first, with the publish step expected to fail), or publish a `0.0.0` placeholder and let the workflow publish `0.1.0` right after.
3. **Add a trusted publisher** on each package: Settings → Trusted publishing → GitHub Actions, organization `jmlweb`, repository `svgworm`, workflow filename `release.yml`, environment `npm-publish` (the token is only minted inside that environment, so binding the publisher to it rejects a token from any other job). Allow `npm publish` and `npm dist-tag` for the publisher. The `repository.url` in both `package.json` files already points at `git+https://github.com/jmlweb/svgworm.git`. npm 12 can do the same from the CLI: `npm trust github svgworm --file release.yml --repo jmlweb/svgworm --env npm-publish --allow-publish`. The npm docs (checked 2026-10-13) do not mention an expiry for an unused configuration.
4. After the first trusted publish succeeds, **disable token publishing** on both packages ("Require two-factor authentication and disallow tokens") so trusted publishing is the only path.
5. **Record the launch date** of `0.1.0` in `docs/traction.md` and in TSK-018. It starts the 12-week kill-criteria clock ([ADR-0005](adr/0005-build-standalone-with-kill-criteria.md)); the review is on launch + 84 days.

Pre-releases (if ever needed) use Changesets pre mode with the `next` dist-tag: `pnpm changeset pre enter next`, merge, `pnpm changeset pre exit` to leave.

## Open items

- `pnpm changeset publish` calls `npm publish` for each package. The Node 24 runner's npm is pinned to the `11` major in the workflow to satisfy the npm ≥ 11.5.1 requirement of trusted publishing. If the first publish fails on OIDC, switch the `publish` input to a script that runs `pnpm pack` and `npm publish <tgz>` per package (ADR-0009, "Publish command").
- The registry's staging left a public `0.0.0-stage` placeholder version on both packages. Deprecate them once (`npm deprecate svgworm@0.0.0-stage "staging placeholder"`, same for `@svgworm/react`), with 2FA, so `npm view` and the package pages stop listing them as real versions.
- The hand-published 0.1.0 tarballs have no provenance attestation. The first workflow release will, and the README provenance badge check above applies from then on.
