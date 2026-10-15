---
id: TSK-067
title: Opt-in cross-origin (CDN) sprites via a minimal injecting loader
status: pending
priority: P3
tags: []
created: 2026-10-15
source: idea/PLN-003
depends-on: []
---

# Opt-in cross-origin (CDN) sprites via a minimal injecting loader

## Description

### Goal

Let users serve svgworm sprites from a CDN or any other origin. An opt-in mode, `crossOrigin: "inject"`, emits a tiny framework-agnostic loader. The loader fetches the sprite with CORS, verifies its integrity and injects it into the page, so `use` icons reference same-document ids (`<use href="#id">`). The default delivery stays an external same-origin sprite with zero client JS.

Agreed in grilling (2026-10-15):

- The mode is an opt-in exception to principle 1, recorded in an ADR. Icons are blank without JS in this mode.
- An explicit config key is required. An absolute `https:` `publicPath` without `crossOrigin: "inject"` still exits 2.
- The loader is a hashed file emitted into `outDir`, so it can be served from the CDN too.
- The manifest gains a sha384 `integrity` for the sprite. This is a contract change and needs an ADR and a changeset.
- The React and Astro adapters switch markup in inject mode. Plain HTML gets documentation.
- `init` gets one prompt plus a `--cdn-url` flag. Uploading files to the CDN is out of scope.
- P3, sequenced after TSK-054 (active, touches `init`). The work starts with a browser spike.

Full context, files and risks: `.backlog/ideas/` PLN-003.

### Approach

1. **Spike** (`spikes/<task-id>-cross-origin-inject/`), reusing `spikes/TSK-002-external-use/src/check.mjs` with two origins in Chromium, Firefox and WebKit: fetch with `mode: 'cors'` + `integrity`, `DOMParser` (`image/svg+xml`), hidden `<svg>` of `<symbol>`s appended to `body`; SRI mismatch injects nothing; no-CORS CDN fails with a clear console error; `img` and `mask` stack icons cross-origin with and without CORS; CSP (`script-src`, `connect-src`); CLS 0; time to paint vs same-origin `use`; SPA and duplicate-script guard; loader about 500 B, no deps. Also: page ids colliding with injected symbol ids and internal `url(#…)` refs (one shared id namespace), and React hydration/navigation keeping the injected `<svg>`.
2. **ADR (opus):** qualify principle 1, accept fetch-and-inject for Q-02 with the reverse proxy as the documented zero-JS alternative, define config key, loader file and security model (SRI, inert parsing, strip `on*`/`<script>`). Update AGENTS.md principle 1, `docs/open-questions.md` Q-02, `docs/viability.md`.
3. **Contract ADR + `docs/output-contract.md`:** `publicPath` may be absolute `https:` only with `crossOrigin: "inject"`; `sprites.<group>.sprite.integrity` (sha384 base64); loader `{ file, url }`; inject-mode marker. Decision from review: emit `version: 2` only in inject mode (the contract already says adapters fail loudly on an unknown version), so non-CDN users keep version 1; widen the `version` literal in `icons.d.ts` and `SvgwormManifest`. Ships as a minor with a Breaking note (ADR-0009).
4. **Tests first:** schema cases (with/without key, `http:` rejected), `resolve.ts` and init prompt validation, inject-mode manifest and loader snapshots, determinism (loader bytes and hash content-only, LF), type tests, React and Astro render tests, init plan tests, non-TTY and `--json` reporter snapshots, ownership regex test. Default-mode output must stay byte-identical.
5. **Core:** `crossOrigin` in `config/schema.ts`; `normalizePublicPath` callers (`config/resolve.ts:60`, `cli/init/prompts.ts:54`) get the mode context; sha384 helper in `assemble/hash.ts`; new `emit/loader.ts`; `icons.loader.<hash>.js` in `compile.ts`, `build.ts`/`api.ts`; extend `OWNED_FILE` in `write.ts`; `check.ts` compares the loader. Keep write order: assets, then module and manifest, then pruning.
6. **Adapters:** `@svgworm/react` renders `<use href="#id">` in inject mode and exposes a Server-Component-safe once-only loader `<script src async>`; Astro `Icon.astro` template (in `cli/init/plan.ts`) the same, plus a layout loader tag. Stack icons keep absolute URLs.
7. **CLI and init (after TSK-054 lands):** `--cross-origin inject` build flag; `init` prompt "Serve sprites from a CDN on another origin?" (default no) and `--cdn-url <url>`, writing `publicPath` and `crossOrigin` and printing CDN setup steps (CORS header, immutable cache, upload `outDir`).
8. **Docs:** site `config`, `cli`, `nextjs` (`assetPrefix` recipe), `astro`, maybe `comparison`; `llms.txt`, both skills, package READMEs, JSON Schema description; changeset. Docs lead with the zero-JS proxy option.

Risks to keep in view: principle 1 dilution, CDN compromise (SRI + inert parse + security-reviewer pass), CORS/CSP burden on users, deploy skew (TSK-065), paint delay (ADR-0019), id-namespace collisions, hydration.

## Acceptance Criteria

- [ ] Browser spike in spikes/<task-id>-cross-origin-inject/ with RESULTS.md: inject via fetch+SRI+DOMParser, SRI mismatch, missing CORS, img/mask stack cross-origin, CSP, CLS, paint delay, SPA/duplicate-loader guard, page/icon id collisions, React hydration keeps the injected svg
- [ ] ADR accepted: principle 1 opt-in exception, Q-02 resolved (proxy documented as zero-JS option), security model; AGENTS.md, open-questions.md and viability.md updated
- [ ] Output contract updated by ADR: https publicPath only with crossOrigin inject, sprite integrity (sha384), loader file, manifest version 2 only in inject mode, d.ts version types widened
- [ ] Tests written first: schema, resolve and init prompt validation, inject-mode manifest and loader snapshots, determinism, type tests, React and Astro render tests, reporter snapshots, ownership regex
- [ ] Core emits a hashed icons.loader.<hash>.js in inject mode; resolve.ts, build/api, write.ts ownership and check.ts cover it; no new runtime dependency
- [ ] Default-mode output is byte-identical to before (site:check and example:check pass)
- [ ] React and Astro adapters render <use href="#id"> plus a once-only loader tag in inject mode, Server-Component safe
- [ ] CLI --cross-origin inject flag and init CDN prompt plus --cdn-url, started only after TSK-054 lands; init never defaults to inject
- [ ] Docs (site config/cli/nextjs/astro, llms.txt, skills, READMEs, JSON Schema) and a minor changeset with a Breaking note; security-reviewer pass done

## Notes

## Learnings

## Progress Log

- [2026-10-15] Created