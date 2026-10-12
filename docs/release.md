# Releasing

How a version of `svgworm` and `@svgworm/react` reaches npm. Decided in [ADR-0009](adr/0009-license-versioning-and-release.md); this page is the checklist. The two packages are a Changesets `fixed` group, so they always share a version.

## Every change

1. User-facing change: `pnpm changeset`, pick the bump (during 0.x a breaking change is a **minor** with a "Breaking" note; fixes and features are patches or minors as the changeset says), write the note for the changelog, commit the file.
2. CI (`.github/workflows/ci.yml`) warns when a PR has no changeset.

## Every release

The `Release` workflow (`.github/workflows/release.yml`) runs on every push to `next`:

- With pending changesets, it opens or updates the **"chore(release): version packages"** PR. That PR bumps both `package.json` versions, writes `CHANGELOG.md` per package and deletes the changesets. Review the changelog like code.
- When that PR is merged, the same workflow publishes both packages with `pnpm changeset publish` through **npm trusted publishing** (OIDC, no token in the repo), tags `svgworm@x.y.z` and `@svgworm/react@x.y.z`, and creates the GitHub releases from the changelog.

After it finishes:

1. Open each package on npmjs.com and confirm the **Provenance** badge links to the workflow run.
2. Smoke test from a clean folder: `pnpm add -D svgworm@x.y.z @svgworm/react@x.y.z`, run `svgworm init --yes`, `svgworm`, and build the Next.js example against the published versions.
3. Check real Safari and iOS by hand on the example (Playwright's WebKit is not Safari; `testing.md`).

## One-time setup before v0.1.0 (maintainer, needs npm login)

Trusted publishing is configured per package on npmjs.com, and the form lives on an existing package's settings page. The npm docs do not say whether an unpublished package can get a trusted publisher, so the safe order is:

1. **Create the npm org `svgworm`** so the `@svgworm` scope exists.
2. **First publish by hand**, once, with 2FA, so both packages exist:
   ```bash
   pnpm build && pnpm check:packages
   cd packages/svgworm && npm publish --access public --provenance=false
   cd ../react && npm publish --access public --provenance=false
   ```
   Do this with the real `0.1.0` versions (merge the version PR first, with the publish step expected to fail), or publish a `0.0.0` placeholder and let the workflow publish `0.1.0` right after.
3. **Add a trusted publisher** on each package: Settings → Trusted publishing → GitHub Actions, organization `jmlweb`, repository `svgworm`, workflow filename `release.yml`, no environment. Allow `npm publish` and `npm dist-tag` for the publisher. The `repository.url` in both `package.json` files already points at `git+https://github.com/jmlweb/svgworm.git`. The configuration expires if the first publish does not happen within 2 days.
4. After the first trusted publish succeeds, **disable token publishing** on both packages ("Require two-factor authentication and disallow tokens") so trusted publishing is the only path.
5. **Record the launch date** of `0.1.0` in `docs/traction.md` and in TSK-018. It starts the 12-week kill-criteria clock ([ADR-0005](adr/0005-build-standalone-with-kill-criteria.md)); the review is on launch + 84 days.

Pre-releases (if ever needed) use Changesets pre mode with the `next` dist-tag: `pnpm changeset pre enter next`, merge, `pnpm changeset pre exit` to leave.

## Open items

- `pnpm changeset publish` calls `npm publish` for each package. The Node 24 runner's npm is upgraded to `latest` in the workflow to satisfy the npm ≥ 11.5.1 requirement of trusted publishing. If the first publish fails on OIDC, switch the `publish` input to a script that runs `pnpm pack` and `npm publish <tgz>` per package (ADR-0009, "Publish command").
- The `svgworm` and `@svgworm/react` names were free on 2026-10-12 (npm returns 404). Whether the `@svgworm` scope is free is only known when the org is created.
