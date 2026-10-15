# Questions to answer (TSK-019)

Existing public questions where svgworm solves the asker's problem, with draft answers that solve it without svgworm first. Researched 2026-10-16, read-only: nothing was posted. The maintainer posts, with the disclosure. Re-run the searches every few weeks; record each answer posted in TSK-019's progress log.

Honest summary: the search turned up one strong fit (the Next.js Turbopack sprite discussion). The other SVG-in-Next.js questions are closed and answered, are older than 18 months, or are not about what svgworm does. Fewer good ones beat 10 weak ones, so this file has one full draft plus a list of what was skipped and why.

---

## 1. How to use SVG sprite with Turbopack? (strong fit)

- URL: https://github.com/vercel/next.js/discussions/84595
- Repo / category: vercel/next.js, Help
- Date: created 2025-10-07, no comments, no answer chosen
- Status: open, unanswered (as of 2026-10-16)
- Why it fits: the asker wants one external `sprite.svg` with `<use href="/sprite.svg#id">` in a Next.js app with about 100 icons, and says a Turbopack loader cannot emit a file once after all modules. That is the exact gap svgworm fills (a CLI, not a loader).

Draft answer (plain English, no svgworm first):

> Turbopack loaders can't write a shared file, so build the sprite outside the bundler, in a plain Node script that runs before `dev` and `build`:
>
> 1. Read every `.svg` in your icon folder.
> 2. Run each file through SVGO to clean it up.
> 3. Wrap each one as `<symbol id="<name>" viewBox="...">` (copy the `viewBox`, drop the outer `width`/`height`).
> 4. Concatenate them into `public/sprite.svg`.
> 5. Add it to `package.json` as `"predev"` and `"prebuild"`.
>
> Then render with `<svg width="24" height="24" aria-hidden="true"><use href="/sprite.svg#home" /></svg>`. Two caveats:
>
> - Gradients, masks and filters inside an external `<use>` sprite render blank in WebKit (Safari). Keep those icons as separate files and use `<img>` instead.
> - Check for duplicate ids across folders, because the script will produce them silently.
>
> Set `Cache-Control: public, max-age=31536000, immutable` on `/sprite.svg` only if the filename carries a content hash. A fixed name needs a short cache instead.

Where svgworm fits (disclosure: I maintain svgworm):

> Disclosure: I maintain svgworm. It is that build step as a CLI: no bundler plugin, so it works under Turbopack. It writes a content-hashed sprite, typed icon names, and a `createIcon(manifest)` component for Server Components, and it puts gradient icons in a separate file automatically. Setup: `pnpm add -D svgworm && pnpm add @svgworm/react`, then `pnpm svgworm init`. Guide: https://svgworm.com/docs/nextjs/

Notes: this is the best match. It is also the one place the maintainer should check first, since the asker is asking for exactly what the project does. Post only after the usual review and with the disclosure above.

---

## Skipped or borderline (and why)

- **vercel/next.js#81504, "SVGR does not work with Turbopack"** (created 2025-07-10, closed 2025-07-10 by the team; 5 comments). Closed and answered: `--turbo` for builds, plus the Next.js `turbopack.rules` example. svgworm is not a fit: the question is about SVGR configuration, and svgworm does not use SVGR. Not included.
- **gregberge/svgr#985, "SVGR doesn't support Windows with turbopack on Next.js 15"** (open, created 2024-12-24, last update 2025-03-12, 3 comments). Still open, but the problem is SVGR on Windows. The comments already point at the official `turbopack.rules` fix. svgworm would not change the answer. Not included; the honest answer is "use the Next.js `turbopack.rules` example, svgworm is not involved".
- **vercel/next.js discussion 89181, "Turbopack and raw svg"** (created 2026-01-28, open, 1 comment, no answer chosen). Asker wants the raw SVG source from `import ... .svg?raw` under Turbopack. svgworm does not give raw strings; it gives sprite references. Weak fit. Not included as a draft. The existing comment's fs-read workaround is correct and is the honest answer.
- **vitejs/vite#10400, "Generation of static svg sprite file in dist"** (created 2022-10-10, open, 8 comments, last update 2025-03-03). Good topic match for svgworm's Vite path, but outside the 18-month window and no activity for about 19 months. Borderline. Not drafted. Could be a reasonable comment only if the maintainer wants a long-tail target.
- **react-icons/react-icons#368** (2020, closed). Out of window.
- **Stack Overflow**: WebSearch found no recent (last 18 months) SO thread that matches. The sprite-gradient material is 2015-2019 era (WebKit bugs 105904, 189499, 243341), and the "SVG icon black with currentColor" results were general guidance. The "SVGR Turbopack" results were webpack-era answers (felixmosh's `issuer` rule). None met the criteria, so none are drafted.
- **Searches with no matching results**: `svg currentColor multicolor black`, `svg use href gradient safari`, `svg icons server components client bundle`, `svg sprite server component`. No open GitHub issues or discussions in the window matched them.

## Evidence worth keeping (not questions)

- WebKit gradient-in-external-`<use>` behavior is the same class of issue svgworm measures in its TSK-002 spike. The comparison page already cites it, so no new claim is needed.
- The `.github` search tooling returns few results for `in:title` phrasing. Use plain keyword search if this is repeated.
