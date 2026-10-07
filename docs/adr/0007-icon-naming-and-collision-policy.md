# 0007. Icon naming: NFC lowercase names with `/` namespaces, a separate ASCII symbol id, and collisions as errors

- **Status:** accepted
- **Date:** 2026-10-08
- **Task:** TSK-006
- **Resolves:** Q-31, Q-32 (for v0.1); R-02, R-03

## Context

Icon names are the product's most visible public API (principle 4). They become TS literal types, manifest keys, and the `name` prop. Whatever we pick, users write it in their source code, so changing it later breaks them.

The forces:

- **Determinism (principle 2).** The old prototype joined path segments with `.` and gave duplicate names a `-2`, `-3` suffix in crawl order. The same input could produce different types on different machines ([LRN-003](../../.backlog/learnings/LRN-003-prototype-ids-were-crawl-order-dependent/index.md), [viability.md](../viability.md) lesson 4).
- **Unicode normalization.** macOS file systems can hand back a name in NFD while the developer types NFC. @neodx/svg gives `café.svg` a different id, hash, and type when the file name is NFD ([TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md), "Determinism: NFC vs NFD").
- **Case-insensitive file systems.** macOS and Windows treat `Icon.svg` and `icon.svg` as the same file. Linux CI does not. Git on such systems often misses case-only renames.
- **One string can't serve two grammars.** A name like `social/github` or `café` is a fine TS string literal. As an XML id or a `#fragment` it is fragile:
  - `/` is not allowed in an XML `NCName`;
  - non-ASCII fragments get percent-encoded in URLs, so a match then depends on the browser decoding them again.
- **Fail loudly (principle 5).** R-03 already rules out silent renames.
- **Timebox.** TSK-014 limited this to one week, with proposed defaults: `/` separator, NFC, lowercase kebab ids, collisions are an error, alias map deferred.

## Options considered

**Namespace separator**

1. **`/`**: matches the folder layout people already see, and can't appear inside a file name on any OS, so it is always unambiguous. Cons: not valid in an XML id. Solved by option B below.
2. **`.`** (prototype): `.` often appears inside file names (`icon.filled.svg`), so it would need escaping or would be ambiguous.
3. **`:`** (@neodx/svg, Iconify `mdi:home`): familiar from Iconify, but it reads as "set:icon", which allows only one level, while folders nest. It isn't valid in a Windows file name and isn't allowed in an `NCName` either.
4. **`-`**: `a-b/c` and `a/b-c` would both become `a-b-c`, creating collisions that can't be fixed without renaming folders.

**Name and id**

- **A. One string for both** (the proposed "lowercase kebab ids"). With `/` it isn't a valid `NCName`, and non-ASCII names need percent-decoding to match through external `<use>`. To make it valid, we'd have to give up `/` or Unicode in the public name.
- **B. Two identifiers.** A readable public name, plus an ASCII symbol id encoded from it in a reversible way. Chosen.
- **C. Hashed symbol ids** (`i-3f9a…`). Always valid, but unreadable in devtools and in the sprite. It also brings collision risk (tiny, but we'd have to check for it).

**Case**

- **Lowercase only, no camelCase splitting.** Chosen.
- **Split camelCase** (`ArrowLeft` → `arrow-left`, as lodash `kebabCase` does). The name would then depend on letter case, which case-insensitive checkouts don't reliably keep. Splitting rules for acronyms (`SVGIcon`, `iOS`) are also guesswork.
- **Keep case.** `Icon.svg` and `icon.svg` would be two names on Linux and one file on macOS, so the output would depend on the OS.

**Unicode**

- **NFC.** Chosen. It is what people type and what macOS APFS keeps when you create a file from typed text.
- **NFKC.** Folds compatibility characters (`ﬁ` → `fi`, full-width letters). It changes what users see, with a small benefit.
- **ASCII-only names** (error, or transliterate). Shuts out non-English teams, and transliteration needs locale tables, which brings a dependency and its own nondeterminism.

**Collisions**

- **Error listing every file.** Chosen for v0.1.
- **Alias map.** Deferred to TSK-025.
- **Counter or first-wins.** Ruled out by R-03 and LRN-003.

## Decision

The full rules and examples are in [output-contract.md, "Icon naming"](../output-contract.md#icon-naming).

1. **Public name** = a pure function of the path relative to its source folder:
   - split on `/` and `\`;
   - drop the `.svg` extension (matched case-insensitively);
   - for each segment:
     1. NFC;
     2. locale-independent lowercase, then NFC again;
     3. `ς` → `σ`;
     4. turn each separator run into one `-`. A run is made of non-letter, non-mark, non-number characters, plus default-ignorable code points, plus combining marks that aren't attached to a letter or number;
     5. trim `-` from both ends;
   - join the segments with `/`.

   These are errors: an empty segment, and a path that isn't valid Unicode (U+FFFD). Dotfiles and non-`.svg` files are not inputs.
2. **Namespaces by default.** Folders become `/` segments. A `flatten` option keeps only the file segment (R-02).
3. **Symbol id** = `i-` + the name, where `a-z 0-9 -` stay, `/` becomes `--`, and every other character becomes `_<hex code point>_`. It is ASCII-only, a valid `NCName`, and injective. Internal ids in the sprite take the form `<symbolId>_<n>`, where `n` is a document-order ordinal. Such an id can never equal a symbol id or another icon's internal id.
4. **Collisions are errors.** They list every file involved, are reported together with the other R-04 errors, and nothing is written. Errors are sorted by code point, so they never depend on crawl order. Several source folders share one name space, and folders that overlap are a config error. Symlinks are not followed. There is no alias map in v0.1.
5. **Ordering** is by Unicode code point (UTF-8 byte order), never by locale.

### Where this differs from the proposed defaults

- **"Lowercase kebab ids" is split into two things.** The *name* is lowercase, kebab-style, and keeps Unicode letters. The *id* is a separate ASCII encoding. One string can't be both a readable Unicode TS literal with `/` and a safe XML id or URL fragment.
- **"Kebab" doesn't split camelCase.** `ArrowLeft.svg` → `arrowleft`. Users who want `arrow-left` name the file that way.
- `/`, NFC, collisions as errors, and the deferred alias map are kept as proposed.

## Evidence

- **XML names.**
  - SVG 1.1 declares `id` as type `ID`: [SVG 1.1 §5.10.1](https://www.w3.org/TR/SVG11/struct.html#IDAttribute).
  - `ID` values must match `Name`: [XML 1.0 §3.3.1, validity constraint "ID"](https://www.w3.org/TR/xml/#id). `Name` can't start with a digit or `-`: [XML 1.0 §2.3](https://www.w3.org/TR/xml/#NT-Name).
  - In namespace-aware documents, `ID` values can't contain `:`: [Namespaces in XML 1.0 §7](https://www.w3.org/TR/xml-names/#Conformance). That makes them `NCName`s: [§3, NCName](https://www.w3.org/TR/xml-names/#NT-NCName).
  - SVG 2 drops the DTD ([SVG 2, id attribute](https://www.w3.org/TR/SVG2/struct.html#IDAttribute)), but an ASCII `NCName` stays valid under both.
  - `/` is not a `Name` character.
- **URL fragments.** RFC 3986 allows `/` in a fragment, but not non-ASCII characters, which must be percent-encoded: [RFC 3986 §3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5). The WHATWG URL parser percent-encodes non-ASCII fragment characters: [fragment percent-encode set](https://url.spec.whatwg.org/#fragment-percent-encode-set). HTML decodes fragments when it navigates to them ([HTML, "find a potential indicated element"](https://html.spec.whatwg.org/multipage/browsing-the-web.html#find-a-potential-indicated-element)), but that algorithm covers document navigation, not how `<use>` resolves an external reference. We have not tested `<use>` with an encoded fragment. An ASCII `[a-z0-9_-]` id never gets encoded, so that test isn't needed. SVG fragment identifiers name an element by id: [SVG 2 §16.1.4](https://www.w3.org/TR/SVG2/linking.html#SVGFragmentIdentifiers).
- **CSS.** An identifier that starts with a letter and contains only `[a-z0-9_-]` needs no escaping in `#id` selectors: [CSS Syntax 3, ident-token](https://www.w3.org/TR/css-syntax-3/#ident-token-diagram). This matters for the post-v0.1 inline sprite.
- **Unicode normalization.** Normalization forms: [UAX #15](https://unicode.org/reports/tr15/). Normalization of assigned characters is stable across Unicode versions: [Unicode Stability Policy](https://www.unicode.org/policies/stability_policy.html#Normalization). HFS+ stored decomposed names: [Apple QA1173](https://developer.apple.com/library/archive/qa/qa1173/_index.html). APFS keeps whatever form the creating app passed in (often, but not always, NFC) and compares names normalization-insensitively: [Apple File System Guide FAQ](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/APFS_Guide/FAQ/FAQ.html). Git has [`core.precomposeUnicode`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreprecomposeUnicode) for this exact problem.
- **Case.** Default lowercasing applies the context-dependent Final_Sigma rule: [ECMA-262 `toLowerCase`](https://tc39.es/ecma262/#sec-string.prototype.tolowercase), [SpecialCasing.txt, Final_Sigma](https://www.unicode.org/Public/UCD/latest/ucd/SpecialCasing.txt). That is why `ς` → `σ` is needed. [`core.ignoreCase`](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreignoreCase) says git on case-insensitive file systems doesn't track case-only changes the same way. `String.prototype.toLowerCase` is locale-independent: [ECMA-262](https://tc39.es/ecma262/#sec-string.prototype.tolowercase). `toLocaleLowerCase` is not, since Turkish `I` lowercases differently.
- **Prototype** ([spikes/TSK-006-icon-naming](../../spikes/TSK-006-icon-naming/RESULTS.md)), Node 24.13, Unicode 16.0:
  - every row of the contract's example table passes, and every id matches `^i-[a-z0-9_-]+$`;
  - the fixtures `duplicates/` (namespaced: `actions/close` and `arrows/close`; flattened: one collision error listing both files) and `non-ascii/` give identical names and ids for NFC and NFD paths, in any input order;
  - across all 1,112,064 code points (as `a<cp>b`), NFC and NFD input give the same result, and running the derivation on its own output changes nothing;
  - variation selectors, mark-only names, and U+FFFD error out or collide instead of producing invisible names;
  - raw source paths still differ between NFC and NFD, which is why emitted paths must be NFC-normalized too.
- **Competitor.** [TSK-007 spike](../../spikes/TSK-007-neodx-next/RESULTS.md): NFD names change @neodx/svg's ids and types. [LRN-003](../../.backlog/learnings/LRN-003-prototype-ids-were-crawl-order-dependent/index.md): crawl-order counters.
- **Internal ids.** [LRN-001](../../.backlog/learnings/LRN-001-prototype-svgo-pipeline-worth-porting/index.md): the prototype prefixed internal ids per icon (svgo `prefixIds`). The `<symbolId>_<n>` form makes that prefix collision-proof against symbol ids.

## Self-review (doubt-driven)

A fresh-context adversarial review of the first draft found no blockers. These findings were adopted:

- variation selectors and lone combining marks gave invisible or look-alike names;
- final sigma made a case-only rename change the name;
- U+FFFD from undecodable names was silently dropped;
- the `.` in internal ids reads as a class selector in CSS and as a syncbase in SMIL. It is now `_<n>`;
- naming errors came out in crawl order;
- some evidence was overstated: xml:id, HTML fragment decoding, APFS.

It agreed with both deviations (a separate ASCII id, no camelCase splitting) and with the `i-` prefix.

## Consequences

- **Types.** Types and adapters use the public name. The `<use href>` fragment uses the symbol id from the manifest. The manifest must carry both. It already does, as `icons.<iconName>.id`.
- **Adapters.** Adapters never derive ids. They look names up without falling back to the prototype chain.
- **TSK-011 needs tests for:**
  - every row of the example table;
  - NFC and NFD input in shuffled order;
  - collisions that list every file;
  - internal ids of the form `<symbolId>_<n>`;
  - errors sorted by code point;
  - rejection of undecodable file names. Read directory entries as bytes and validate them as UTF-8, rather than trusting U+FFFD to show up;
  - code-point ordering.
  The optimizer configuration (svgo `prefixIds` / `cleanupIds`, or equivalent) must produce that internal id form.
- **Breaking changes.** Changing any rule here renames icons, which breaks users. Until 1.0 that needs a superseding ADR and a semver-minor note. After 1.0 it needs a major version.
- **Easier:** reproducible names on every OS, clear errors, readable ids for ASCII names.
- **Harder:** non-ASCII ids are opaque (`i-_65e5__672c_`), and the camelCase choice means some users will rename files.

## Open items (default taken; simplest reversible option)

- **Alias map (Q-32)** → TSK-025. v0.1: always an error. Adding aliases later is additive.
- **Per-source-folder namespace prefix.** v0.1: all source folders share one name space, and cross-folder collisions are errors. A prefix option would be additive.
- **Partial flattening** (drop only the top folder, or map folders to other names). v0.1: only all-or-nothing `flatten`. Additive.
- **Configurable symbol id prefix** (`i-`). Fixed in v0.1. Revisit with the inline sprite (Q-25, TSK-022), where ids share the page's id space.
- **Unicode version drift.** Lowercasing, the letter, mark, and number classes, and `Default_Ignorable_Code_Point` all come from the runtime's Unicode tables. A character assigned in a newer Unicode version could be classified differently on an older runtime. NFC of assigned characters is stable. Default: rely on the stack ADR's (TSK-009) supported runtime range, and do nothing more for v0.1.
- **NFKC, transliteration, camelCase splitting.** Rejected for v0.1. Any of them would rename icons, so they would need a superseding ADR.
- **Symlinks.** Not followed in v0.1, which avoids loops and duplicate inputs. Following them later would be additive.
- **Overlapping source folders.** A config error in v0.1. Could be relaxed later.
- **Source path in the manifest.** Not decided here. If TSK-008 adds one, it must be relative, NFC, and `/`-separated.
