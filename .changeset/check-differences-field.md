---
'svgworm': minor
---

`svgworm check --json` and the `CheckOutcome` type now expose the list of files a build would write or remove as `differences`. The old name, `stale`, held entries whose own status could be `missing`, `changed` or `stale`, which was confusing. `stale` stays as a deprecated alias with the same contents for one minor and is then removed.
