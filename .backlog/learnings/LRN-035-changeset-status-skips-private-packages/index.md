---
id: LRN-035
title: changeset status skips private packages, so site-only PRs need no changeset
status: active
tags: [changesets, monorepo, release]
task: TSK-036
created: 2026-10-14
---

Context: a private workspace package (apps/site) in a Changesets monorepo, with a CI reminder that fails when a PR has no changeset.
Insight: changeset status ignores private packages that have no changeset. Verified in a throwaway worktree: a site-only commit exits 0, and a commit touching a published package exits 1. privatePackages { version: false, tag: false } stops private packages from being bumped at all.
Application: private apps need no changeset in CI. Verify it the same way before relying on it: a site-only range should pass, a published-package range should fail.
