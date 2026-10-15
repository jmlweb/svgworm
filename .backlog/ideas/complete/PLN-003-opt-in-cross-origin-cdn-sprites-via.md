---
id: PLN-003
title: Opt-in cross-origin (CDN) sprites via a minimal injecting loader
status: approved
created: 2026-10-15
complexity: high
reviewed: 2026-10-15
task-id: TSK-067
---

## Goal

Let users serve svgworm sprites from a CDN or any other origin. An opt-in mode, `crossOrigin: "inject"`, emits a tiny framework-agnostic loader. The loader fetches the sprite with CORS, verifies its integrity and injects it into the page, so `use` icons reference same-document ids (`<use href="#id">`). The default delivery stays an external same-origin sprite with zero client JS.

Agreed in grilling (2026-10-15):

- The mode is an opt-in exception to principle 1, recorded in an ADR. Icons are blank without JS in this mode.
- An explicit config key is required. An absolute `https:` `publicPath` without `crossOrigin: "inject"` still exits 2.
- The loader is a hashed file emitted into `outDir`, so it can be served from the CDN too.
- The manifest gains a sha384 `integrity` for the sprite. This is a contract change and needs an ADR and a changeset.
- The React and Astro adapters switch markup in inject mode. Plain HTML gets documentation.
- `init` gets one prompt plus a `--cdn-url` flag. Uploading files to the CDN is out of scope.
- P3, sequenced after TSK-054 (active, touches `init`). The work starts with a browser spike.

## Context

- **Why.** CDNs on another origin are standard deployment practice, for example a Next `assetPrefix`, S3 + CloudFront or Cloudflare. svgworm only works when sprites are same-origin. That is a real adoption blocker (`docs/viability.md`, "Cross-origin sprites", Medium risk).
- **The constraint.** All three engines block a cross-origin `<use>`, even with `Access-Control-Allow-Origin: *` ([ADR-0006](../../../docs/adr/0006-per-icon-delivery-external-use-and-svg-stack.md)). [ADR-0010](../../../docs/adr/0010-sprite-url-delivery-generated-module-and-public-path.md) enforces it: `normalizePublicPath` in `packages/svgworm/src/core/config/schema.ts` rejects relative, protocol-relative and `http(s):` values with exit 2. ADR-0010 explicitly leaves room: "a cross-origin workaround (Q-02) can be added later without breaking anything".
- **Q-02** in `docs/open-questions.md` lists fetch-and-inject as a candidate workaround, alongside a same-origin proxy and an inline fallback. This idea picks fetch-and-inject as the opt-in. The proxy stays a documented zero-JS alternative.
- **Per delivery form:**
  - `use` (sprite) needs injection.
  - `img` (stack) loads cross-origin natively. An `<img>` needs no CORS and the fragment `:target` still applies. To be confirmed in the spike.
  - `mask` (stack): CSS `mask-image` is fetched in CORS mode, so it probably works when the CDN sends CORS headers. Unverified.
- **Related:**
  - LRN-018: Next `public/` is not affected by `assetPrefix`, which is why same-origin works by default in Next.
  - LRN-017: WebKit ignores `url(#…)` in external `use`. This is irrelevant to injected sprites, but stack icons keep their current path.
  - [ADR-0019](../../../docs/adr/0019-sprite-preload-not-recommended.md): no preload. Revisit only if the spike shows the loader delays icons badly.
  - TSK-065: deploy skew with hashed files applies to the CDN too.

## Approach

1. **Spike (`spikes/TSK-xxx-cross-origin-inject/`).** Reuse the Playwright harness in `spikes/TSK-002-external-use/src/check.mjs`. Serve the page and the "CDN" from two origins and test in Chromium, Firefox and WebKit:
   - a loader that does `fetch(url, { mode: 'cors', integrity })`, parses the response with `DOMParser` (`image/svg+xml`) and appends a hidden `<svg>` with the `<symbol>`s to `document.body`; `<use href="#id">` then renders and follows `color`;
   - an SRI mismatch, which must reject the sprite and inject nothing;
   - a CDN without CORS headers, which must fail visibly with a console error;
   - `img` and `mask` stack icons from the other origin, with and without CORS;
   - CSP: the loader as an external `<script src>` from the CDN needs `script-src` and `connect-src` for the CDN, and no inline script or nonce;
   - layout shift: the icon box is reserved by `width` and `height` (`1em` default), so CLS should be 0;
   - time to icons painted versus same-origin `use`;
   - SPA and client navigation: the loader injects once, and duplicate script tags are a no-op (guard by a sprite id attribute);
   - loader size target: about 500 B or less, unminified, with no dependencies.
2. **ADR (opus).**
   - Qualify principle 1: cross-origin inject is an explicit opt-in, the default stays zero-JS, and icons are blank without JS in that mode.
   - Accept fetch-and-inject for Q-02, and document the reverse-proxy and rewrite alternative as the zero-JS option.
   - Define the config key, the loader file and the security model (SRI, inert parsing, CSP).
   - Update the AGENTS.md principle 1 text, `docs/open-questions.md` Q-02, and `docs/viability.md`.
3. **Contract ADR and update to `docs/output-contract.md`.**
   - `publicPath` may be an absolute `https:` URL only when `crossOrigin: "inject"` is set.
   - New manifest data:
     - `sprites.<group>.sprite.integrity` (sha384, base64);
     - the loader file `{ file, url }`;
     - a marker for inject mode, so adapters switch markup.
   - Decide whether the change is additive (`version` stays 1, and older adapters keep rendering an absolute `url#id` that silently fails) or bumps `version` to 2 so older adapters fail loudly. Principle 5 favors a bump, or a field that old adapters reject.
   - The change is breaking in 0.x, so it ships as a minor with a changeset ([ADR-0009](../../../docs/adr/0009-license-versioning-and-release.md)).
4. **Write tests first:**
   - config schema cases: an absolute URL with and without the key, and `http:` rejected (https only);
   - snapshots of the manifest and the loader in inject mode;
   - a determinism test: the loader bytes and hash depend on content only;
   - type tests for the new manifest fields;
   - React and Astro render tests for `<use href="#id">` plus the loader tag;
   - init plan tests for the prompt and the flag;
   - non-TTY and `--json` reporter snapshots.
5. **Core.**
   - Config: add `crossOrigin` to the schema and relax `normalizePublicPath` for `https:` origins when it is set.
   - Emit: compute the sha384 of the sprite bytes and generate the loader with the sprite URL and integrity baked in, named `icons.loader.<hash>.js`.
   - Extend the stale-file ownership regex (R-15) to cover loader files.
   - Keep write order: assets first, then the module and manifest, then pruning.
6. **Adapters.**
   - `@svgworm/react`: in inject mode, render `<use href="#id">`. Expose a Server-Component-safe way to emit the loader `<script src async>` once, in the root layout, with no hooks and no context. A small `createIcon` companion export is one option.
   - Astro: the same in the generated `Icon.astro` (template in `packages/svgworm/src/cli/init/plan.ts`), plus a loader tag for the layout.
   - Stack icons (`img`, and `mask` if the spike allows it) keep absolute URLs.
7. **CLI and init.**
   - Add a `--cross-origin inject` build flag (beside `--public-path`), so CI can target the CDN while dev stays same-origin.
   - `init` asks "Serve sprites from a CDN on another origin?" (default no), and `--cdn-url <url>` answers it non-interactively. Init then writes `publicPath` and `crossOrigin`, and prints the CDN setup steps: CORS header, immutable cache, upload `outDir`.
8. **Docs.**
   - Site docs: `config`, `cli`, `nextjs` (`assetPrefix` and CDN recipe), `astro`, and a CDN section in `comparison` if relevant.
   - Update `llms.txt`, both skills and the package READMEs.
   - Add the JSON Schema description for the new key.
   - Add a changeset.

## Files to Modify

- `spikes/<task-id>-cross-origin-inject/`: new throwaway prototype and RESULTS.md (browser matrix)
- `docs/adr/0020-cross-origin-sprites-opt-in-inject-loader.md`: new ADR (principle 1 exception, Q-02)
- `docs/adr/0021-output-contract-cross-origin-fields.md`: new contract ADR, or folded into 0020 if small
- `docs/output-contract.md`: `publicPath` rules, `integrity`, loader file, inject-mode marker, types
- `docs/open-questions.md`: resolve Q-02
- `docs/viability.md`: update the cross-origin risk row
- `AGENTS.md`: principle 1 wording (opt-in exception)
- `packages/svgworm/src/core/config/schema.ts`: `crossOrigin` key, `https:` `publicPath` allowed only with it
- `packages/svgworm/src/core/config/schema.test.ts`: new schema cases
- `packages/svgworm/src/core/emit/manifest.ts`: integrity, loader entry, mode marker
- `packages/svgworm/src/core/emit/module.ts`: `icons.d.ts` types for the new fields
- `packages/svgworm/src/core/emit/loader.ts`: new; generates loader bytes (sprite URL + integrity)
- `packages/svgworm/src/core/assemble/hash.ts`: sha384 base64 helper next to the 8-hex name hash
- `packages/svgworm/src/core/compile.ts`: emit the loader in inject mode
- `packages/svgworm/src/core/write.ts`: ownership regex includes `icons.loader.<hash>.js`
- `packages/svgworm/src/core/check.ts`: compare the loader file too
- `docs/samples/`: new inject-mode sample, plus a `sample.test.ts` case
- `packages/svgworm/src/cli/args.ts`, `packages/svgworm/src/cli/help.ts`: `--cross-origin` flag
- `packages/svgworm/src/cli/init/plan.ts`, `prompts.ts`, `apply.ts` (+ tests): CDN prompt, `--cdn-url`, Astro template in inject mode
- `packages/react/src/create-icon.tsx` (+ `.test.tsx`, `.test-d.ts`, `fixture-manifest.ts`): `#id` in inject mode, loader script export
- `apps/site/src/content/docs/config.md`, `cli.md`, `nextjs.md`, `astro.md`: CDN docs
- `llms.txt`, `skills/svgworm-nextjs/SKILL.md`, `skills/svgworm-astro/SKILL.md`, package READMEs: CDN setup
- `.changeset/*.md`: minor with a "Breaking" note if the manifest version changes

## Risks & Considerations

- **The principle 1 exception is the biggest risk.** It weakens the core pitch ("zero client JS") unless it stays clearly opt-in and the docs lead with the zero-JS proxy option first. Watch that `init` never defaults to it.
- **Security.** Injected SVG runs in the page origin, so a compromised CDN could inject script.
  - Mitigations: SRI on the fetch, parsing with `DOMParser` (inert), and importing only `<symbol>` children.
  - Also consider stripping `on*` attributes and `<script>`, as defence in depth beyond the contract's "no scripts" rule.
  - Needs a `security-reviewer` pass.
- **CORS is a user responsibility.** Without `Access-Control-Allow-Origin` on the CDN the fetch fails and icons stay blank. The loader must log a clear console error naming the URL and the missing header.
- **CSP.** Users need `script-src` and `connect-src` for the CDN. Strict-dynamic or nonce setups need docs.
- **Deploy skew.** If the HTML from one deploy loads a loader or sprite from another, SRI blocks a mismatched sprite and icons go blank. The hashed names help only if old files stay on the CDN (relates to TSK-065).
- **Contract compatibility.** An old `@svgworm/react` reading an inject-mode manifest would render an absolute cross-origin `<use>` that silently fails. Prefer a manifest `version` bump or a field that makes old adapters fail loudly (principle 5).
- **Determinism.** The loader template must be byte-stable across OS (LF line endings, no timestamps). The sha384 is over the exact sprite bytes.
- **Paint delay.** Icons paint after the loader and the sprite fetch, later than with native `use`. Measure it in the spike, and document it in the ADR.
- **Dependency budget.** No new runtime dependency. The loader is generated vanilla JS, and `crypto` covers the sha384.
- **Ordering with TSK-054.** It is active and edits `init`. Start the init part after it lands, to avoid conflicts.

## Open Questions

- Does a cross-origin CSS `mask` with CORS headers render in all three engines? If not, do `mask` icons fall back to `img` (losing `currentColor`), or get injected too?
- Is the contract change a `version: 2` bump, or additive with a field that old adapters reject?
- Should the React loader helper be a separate export (`<IconLoader manifest>`) or come from `createIcon`'s return?
- Should the loader use `<script type="module">` or a classic `async` script? Module scripts always use CORS mode for cross-origin loads, so the CDN header becomes mandatory for the script too.
- Should the loader read its own `document.currentScript.src`, so the CDN base can change without a rebuild? That conflicts with baked-in determinism, so the default is no.
