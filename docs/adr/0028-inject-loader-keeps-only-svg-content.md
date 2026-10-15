# 0028. The inject loader keeps only SVG content; core validation stays the primary control

- **Status:** accepted
- **Date:** 2026-10-15
- **Task:** TSK-067
- **Supersedes:** [ADR-0027](0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md) (its loader security model and evidence only)

## Context

[ADR-0027](0027-opt-in-cross-origin-sprites-through-an-injecting-loader.md) accepted opt-in cross-origin sprites through an injecting loader. Its loader security model was a denylist: drop `<script>`, `<foreignObject>`, `on*` attributes and values starting with `javascript:`. A security review of the implementation found that the denylist let through obfuscated schemes (`java&#9;script:`), HTML elements in the XHTML namespace (`<iframe srcdoc>`, `<base>`), a page-wide `<style>`, external images and SMIL that retargets a link. It also found a root in the XHTML namespace accepted, the hiding `style` attribute exposed to a strict `style-src-attr` policy, and no fallback when `<body>` does not exist yet. ADR-0027's claim that "a hostile sprite with a valid hash runs nothing" was stronger than that code. Everything else in ADR-0027 (the mode, config, manifest version 2, adapters, CSP and CORS requirements) stands.

## Options considered

1. **Keep the denylist and add the reported payloads.** Each new vector needs a new rule.
2. **Allowlist by namespace, deny the few risky SVG elements, and check URLs after normalizing them.** Small, and closed by default for anything not SVG.
3. **Rely on core validation only.** Core already refuses scripts and external references at build time, and the sprite's SRI hash means a CDN cannot change it. But a core bug or a gap in its lists would then reach the page with nothing behind it.

## Decision

Option 2, with core validation named as the primary control and the loader as the second line:

- The root must be `svg` in the SVG namespace. Every element outside the SVG namespace is removed, plus `script`, `foreignObject`, `style`, `a`, `handler`, `listener`, and `set` or `animate` whose `attributeName` is `href`, `xlink:href` or `on*`.
- On every remaining element, the loader removes `on*` attributes, `src`, `srcdoc`, `data`, `action`, `formaction` and `poster`, any value with a `javascript:` or `vbscript:` scheme after removing whitespace and control characters, any `href` that is not `#…` (or a raster `data:image` on `<image>`), and any value with a `url()` that does not start with `#`.
- The sprite is hidden with `width="0" height="0"` and CSSOM (`n.style.cssText`), not a `style` attribute, and is inserted on `DOMContentLoaded` when `<body>` does not exist yet.
- Core validation also rejects HTML elements an SVG can carry (`base`, `meta`, `link`, `img`, `form`, `input`, `frame` and similar), a `srcdoc` attribute, and `src`, `data`, `action`, `formaction` or `poster` values that leave the file.

Accepted as they are: symbol ids share the page's id namespace (they all start with `i-`, and the sprite is prepended so its ids win; documented), a page that already has an HTML injection bug can block the loader's dedupe guard (availability only), and `publicPath` hosts are not limited to `[a-z0-9.-]` (author-controlled; every output escapes it).

## Evidence

- Security review of commit 5ba1d5c (security-reviewer agent, 2026-10-15): 0 critical or high findings; 2 medium (the denylist, and spike payloads that did not cover it), 3 low, 1 informational.
- [`spikes/TSK-067-cross-origin-inject`](../../spikes/TSK-067-cross-origin-inject/RESULTS.md) run against the loader the built core emits (`PRODUCT=1`): 60 of 60 cases pass in Chromium, Firefox and WebKit, including the review payloads (nothing runs, nothing of them is left in the injected sprite, `document.baseURI` and the page are untouched) and a rejected XHTML root.
- `svg/tree.test.ts`: the new core rejections. Real icon sets still build with no error: `lucide-static@0.545.0`, `@tabler/icons@3.35.0`, `heroicons@2.2.0` (24 px), `@mdi/svg@7.4.47`, `simple-icons@15.17.0` and `@phosphor-icons/core@2.1.1`, 28,361 icons in all.
- `pnpm render:check`: every `use` icon of the fixture set renders the same through the hardened loader as through the external sprite, in all three engines.

## Consequences

- ADR-0027 is superseded only in its loader security model and evidence; this ADR is the reference for both.
- The core change ships as a patch changeset; the loader ships with the inject mode itself.
