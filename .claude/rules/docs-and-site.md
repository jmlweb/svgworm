# Docs and site rules

How public text and the site should read, from the maintainer's repeated feedback.

## Public docs (README, package READMEs, site docs)

- Put what a consumer needs first. Development and contributor docs come after.
- Write for humans and for agents. Keep sentences short, and use bold for the words a reader scans for. Long plain paragraphs read as a wall.
- Use Markdown features and emoji sparingly, and keep the Markdown valid on GitHub.
- Say "0.x" instead of a specific version, so the text does not go stale. The site reads the version from `svgworm/package.json` at build time.
- Write the name lowercase: "svgworm".
- The user docs live in `apps/site/src/content/docs/` (ADR-0018). The same-named files in `docs/` are stubs; don't edit them.
- A change to the get-started path, the CLI or the config updates `llms.txt` and the skills in `skills/` in the same change.

## Site (`apps/site`)

- The design system artifact (see `CLAUDE.local.md`) is a general guideline, not a strict spec. A page that follows it to the letter and looks plain is wrong.
- Client-side JS is fine for the site's UI: animations, copy buttons, WebMCP. Icons never need it (principle 1 binds what svgworm generates, not the site).
- The site is the Astro dogfood, so there is no `examples/astro`.
- After a visual change, check it in the dev server at phone and desktop widths, light and dark, before committing.

## Examples

- An example adds only the framework it demonstrates. A Next.js example has no Svelte or Vue in it.
