# TSK-006 prototype: icon naming rules

_Date: 2026-10-08. Throwaway prototype, evidence only. Not product code._

`naming.mjs` implements the rules in [docs/output-contract.md, "Icon naming"](../../docs/output-contract.md#icon-naming). `check.mjs` asserts them and prints the example table. Run `node spikes/TSK-006-icon-naming/check.mjs` (Node 24.13, no dependencies).

## Results

| Check | Result |
|---|---|
| Contract example table | All rows pass. Every symbol id matches `^i-[a-z0-9_-]+$`, an ASCII `NCName` |
| Id injectivity on the examples | Holds: distinct names give distinct ids |
| `fixtures/duplicates/` | Namespaced: `actions/close`, `arrows/close`. With `flatten`: one error listing both files |
| `fixtures/non-ascii/` NFC vs NFD, reversed order | Identical names and ids (`café` → `i-caf_e9_`, `日本` → `i-_65e5__672c_`) |
| Raw source paths NFC vs NFD | **Differ.** Any path written to output must be NFC-normalized too |
| `Icon.svg` + `icon.svg`, `arrow_left` + `arrow-left`, NFC + NFD `café` | One collision error each. Same message in either input order |
| Every code point (1,112,064, as `a<cp>b`, Unicode 16.0) | NFC and NFD input give the same result, and the derivation is idempotent |
| Internal ids `<symbolId>_<n>` | Never equal a symbol id, unique across icons, valid NCName and CSS identifier |
| Adversarial review (first draft) | Found: variation selectors and lone marks giving invisible names, final-sigma context, silent U+FFFD, `.` in internal ids, crawl-ordered errors. All fixed here and in the contract |
