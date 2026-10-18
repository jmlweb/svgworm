---
title: CLI reference
description: "Every svgworm command, flag and exit code: build sprites, check committed output in CI, watch for changes and set a project up, with stable --json output."
order: 7
---

One command builds everything. The others check, watch, and set a project up.

```text
svgworm [build | check | watch | init] [options]
svgworm migrate svgr [options] [--write] [--component-file <path>]
```

| Command | What it does                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| `build` | Write the sprite, manifest and types. The default when no command is given                                    |
| `check` | Exit 1 if the committed output is stale. Writes nothing (for CI)                                              |
| `watch` | Build, then rebuild on every change in the source folders                                                     |
| `init`  | Set a project up: config, `predev`/`prebuild` scripts, Icon wiring (React or Astro), first build              |
| `migrate svgr` | Rewrite SVGR imports into `<Icon name="…" />` calls. A dry run unless `--write` ([Migrate from SVGR](/docs/migrate-from-svgr/)) |

| Option                 | Meaning                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `--config <file>`      | Config file. Default: `svgworm.config.json` (optional)                     |
| `--source <dir>`       | Folder with the SVG files. Repeat for several folders. Default: `icons`    |
| `--out-dir <dir>`      | Where sprite files are written. Default: `public/icons`                    |
| `--public-path <path>` | URL path the sprites are served from. Default: `/icons`                    |
| `--module-dir <dir>`   | Where the manifest and types are written. Default: `svgworm`               |
| `--flatten`            | Drop folder names from icon names (`--no-flatten` to undo)                 |
| `--cross-origin <mode>` | `none` (default) or `inject`: allow an `https://` `--public-path` on a CDN, loaded by a small script ([Sprites on a CDN](/docs/config/#sprites-on-a-cdn)) |
| `--json`               | Print one JSON document on stdout and nothing else                         |
| `--verbose`            | Print one line per icon (plain output only)                                |
| `-h`, `--help`         | Show the help                                                              |
| `-v`, `--version`      | Show the version                                                           |

**Flags override the config file.** The same options are available as [config keys](/docs/config/).

Run it through your package manager: `pnpm svgworm`, `npx svgworm`, `yarn svgworm` or `bunx svgworm`. The pages here write `pnpm svgworm`. The command is the same with any of them.

<aside class="alert alert-important">

<p class="alert-title">Important</p>

`--out-dir` needs `--public-path`, unless it is under `public/`: `--out-dir public/sprites` gives `/sprites`. svgworm cannot guess the URL of any other folder, and **a wrong URL breaks every icon**. A `basePath` or `base` is never added, so include it in `--public-path` yourself.

</aside>

## Exit codes

| Exit code | Meaning                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| `0`       | Built, or `check` found the output up to date                                                   |
| `1`       | Invalid SVG, name collision, or I/O failure (nothing is written); or `check` found stale output; or `migrate svgr` left imports on SVGR |
| `2`       | Usage or config error, or no SVG files found; for `migrate svgr`, also no Icon component or no TypeScript 5 or 6 |

## Output

At the end of a build the CLI prints stats (icons, sprites, sizes, savings, time).

- **`savings`:** the source bytes minus the sprite and stack bytes, before gzip or Brotli. It is an optimizer figure. It says how much svgo and the sprite took out of your files, **not what the browser transfers**.
- **Negative savings:** normal for a handful of tiny icons, because each symbol carries an id and a viewBox.
- **Plain output:** when stdout is not a terminal, or with `--json`, the output is plain and stable. Scripts and AI agents can read it.

The plain output lists the files written or removed, the warnings and errors, and the summary. It does not list every icon, because with a large set that was thousands of lines per CI run. Pass `--verbose` to get one `icon <name> <color> <delivery>` line per icon. `--json` always includes every icon.

## JSON output

`--json` prints **exactly one JSON document** on stdout, pretty-printed, and nothing else there. Diagnostics still go to stderr as text, so a failing run stays readable in a log.

- **`ok`:** always mirrors the exit code. `true` for `0`, `false` otherwise.
- **`warnings` and `errors`:** every document has both. Each is a list of `{ "code", "file", "message" }`.
- **`file`:** the source path with `/` separators, or `""` for a problem with no file. A usage or config error has `code` `cli/usage`. An I/O failure has `cli/unexpected`.

### build document

```json
{
  "ok": true,
  "sourcesDefaulted": false,
  "stats": {
    "icons": 4,
    "mono": 3,
    "multicolor": 1,
    "delivery": { "use": 2, "img": 1, "mask": 1 },
    "sourceBytes": 820,
    "spriteBytes": 289,
    "stackBytes": 661,
    "savingsBytes": -130,
    "durationMs": 12.4
  },
  "icons": [
    {
      "name": "brand/sunset",
      "id": "i-brand--sunset",
      "viewBox": "0 0 24 24",
      "color": "multicolor",
      "delivery": "img",
      "file": "icons/brand/sunset.svg"
    }
  ],
  "warnings": [],
  "errors": []
}
```

`sourcesDefaulted` is `true` when no `sources` were set and svgworm read the default `icons/` folder. The plain output prints `svgworm: using default source icons/` in that case.

`icons` lists every icon in name order, with the manifest fields (`name`, `id`, `viewBox`, `color`, `delivery`) plus the source `file`.

On a failed build the document is `{ "ok": false, "sourcesDefaulted": false, "stats": null, "icons": [], "warnings": [...], "errors": [...] }` and **nothing is written**.

### check document

The build document plus three fields:

```json
{
  "ok": false,
  "sourcesDefaulted": false,
  "upToDate": false,
  "differences": [
    { "path": "public/icons/icons.6d36e3d0.svg", "status": "missing" },
    { "path": "svgworm/manifest.json", "status": "changed" },
    { "path": "public/icons/icons.d907d82b.svg", "status": "stale" }
  ],
  "iconDiff": { "added": [], "removed": ["home"] },
  "stats": { "...": "as in build" },
  "icons": [],
  "warnings": [],
  "errors": []
}
```

- **`differences`:** every file a build would write or remove, expected files first in write order. The status is `missing` (not on disk), `changed` (differs from what a build writes) or `stale` (a hashed sprite of an earlier build).
- **`iconDiff`:** compares the icon names in the committed manifest with the new ones.
- **`stale`:** a deprecated alias of `differences`, kept until the next minor.

### watch documents

One build document per build, the first one for the initial build. Nothing is printed while it waits for a change.

### init document

```json
{
  "ok": true,
  "framework": "react",
  "frameworkSource": "detected",
  "actions": [
    { "path": "svgworm.config.json", "status": "created" },
    { "path": "package.json", "status": "updated" },
    { "path": "components/icon.tsx", "status": "skipped", "reason": "exists with different content; edit it by hand" }
  ],
  "build": { "ok": true, "icons": 1, "written": ["public/icons/icons.1f1ab2b4.svg", "svgworm/icons.js", "svgworm/icons.d.ts", "svgworm/manifest.json"] },
  "nextSteps": ["Install: npm install -D svgworm", "..."],
  "warnings": [],
  "errors": []
}
```

- **`framework`:** `react`, `astro`, `vue`, `svelte` or `null`.
- **`frameworkSource`:** says why (`flag`, `prompt`, `detected` or `null`).
- **`actions`:** each action is a file `init` looked at. It has a `status` of `created`, `updated`, `unchanged` or `skipped`, a `reason` when skipped, and a `warning` when the user must finish something by hand (a script `init` would not touch).
- **`build`:** the first build, either `{ "ok": true, "icons", "written" }` or `{ "ok": false }` with the diagnostics in `errors`.

### migrate document

```json
{
  "ok": false,
  "sourcesDefaulted": false,
  "write": false,
  "componentFile": "src/components/icon.tsx",
  "files": [
    {
      "file": "src/app/page.tsx",
      "changes": [{ "line": 8, "from": "<Logo className=\"h-6\" />", "to": "<Icon name=\"logo\" className=\"h-6\" />" }]
    }
  ],
  "skipped": [
    { "file": "src/app/loading.tsx", "line": 12, "specifier": "../icons/logo.svg", "binding": "Logo", "reason": "passes a ref; the svgworm Icon takes no ref" }
  ],
  "warnings": [],
  "errors": []
}
```

- **`write`:** `true` when the files were changed, `false` for a dry run.
- **`files`:** only the files with a rewrite, each with the old and new JSX (whitespace collapsed).
- **`skipped`:** each import left on SVGR, with the line and why. `ok` is `false` when there is one.
- **`errors`:** with `--write`, a file that could not be saved (`cli/unexpected`). It keeps its old content and is not in `files`; the other files are still written, and the exit code is 1.

### Stability

Before 1.0 the documents can change in a minor version, **never in a patch**. A removed or renamed field stays as a deprecated alias for one minor (as `stale` does now). Every change is listed in the [changelog](https://github.com/jmlweb/svgworm/blob/main/packages/svgworm/CHANGELOG.md) with its version.

Fields are only added, never reordered, so read them by name. `durationMs` varies between runs. Everything else is deterministic for the same input.

## init

`svgworm init` prompts on a terminal and takes flags everywhere else:

| Flag                      | Effect                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--framework <name>`      | `react`, `astro`, `vue` or `svelte`. Default: detected from the dependencies (`vue` or `nuxt` is Vue, `svelte` or `@sveltejs/kit` is Svelte). With several, a terminal asks; otherwise the first of Astro, Vue, Svelte, React wins |
| `--component-file <path>` | Where to create the `Icon` component. The extension must match the framework (`.tsx`/`.jsx`, `.astro`, `.vue` or `.svelte`), or `init` exits 2 |
| `--component`             | Write the component even when no supported framework is a dependency yet                                                    |
| `--no-component`          | Skip the component                                                                                                          |
| `--no-scripts`            | Leave the package.json scripts alone (`predev` and `prebuild`, or `dev` and `build` on Yarn 2+)                             |
| `--agents-md`             | Add a short svgworm section to `AGENTS.md` for AI agents                                                                    |
| `--cdn-url <https-url>`   | Serve the sprites from a CDN on another origin: writes `publicPath` and `crossOrigin: "inject"` and the loader wiring ([Sprites on a CDN](/docs/config/#sprites-on-a-cdn)). A terminal asks, default no. React and Astro only: with Vue or Svelte, `init` exits 2 |
| `--yes`, `-y`             | Accept every default without asking                                                                                         |

`init` reports the framework it chose and why (`flag`, `prompt` or `detected`) in the plain output. In `--json` they are `framework` and `frameworkSource`. For Astro, Vue and Svelte it writes `Icon.astro`, `Icon.vue` or `Icon.svelte` instead of the React wiring. See the [Astro](/docs/astro/), [Vue](/docs/vue/) and [Svelte](/docs/svelte/) setups. For SvelteKit it also writes the sprites to `static/icons/`.

When no source folder has an SVG yet, `init` adds a sample `icons/svgworm.svg` (CC0, icon name `svgworm`) to the first source. It never adds one to a folder that already has icons.

Then it builds once from the config on disk, so the manifest and types exist before the app first imports them. `--json` reports it as `build`. If that build fails, `init` keeps the files it wrote and exits like `svgworm` would (1 for invalid icons, 2 for a setup problem).

It never overwrites a file that differs from what it would write, so **re-running it is safe**.

### Yarn 2+

Yarn 2 and later (Berry, including Plug'n'Play) never run `pre` and `post` scripts. A `prebuild` script would be skipped without an error, and **the app would ship without a sprite**.

When `init` finds Yarn 2+, it puts svgworm in front of the scripts themselves instead: `"build": "svgworm && next build"`. It detects Yarn 2+ from any of these, also at a workspace root:

- a `packageManager` of `yarn@2` or later;
- a `.yarnrc.yml`;
- a Berry `yarn.lock`.

It skips a script that is missing or that uses `||`, `;` or `&`, because a prefix would change what it does. It prints a warning that names the script. Then add `svgworm &&` to that script by hand.

## migrate svgr

`svgworm migrate svgr` rewrites SVGR component imports into `<Icon name="…" />` calls. The name is the one svgworm derives from the file's path in your sources. It prints what it would change and exits. Add `--write` to change the files.

| Flag                      | Effect                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--write`                 | Change the files. Without it, nothing is written                                                          |
| `--component-file <path>` | The Icon component to import. Default: `src/components/icon.tsx` or `components/icon.tsx`, as `init` writes it |

It needs TypeScript 5 or 6 to parse your code: the project's own, or `npx -p typescript@6 -p svgworm svgworm migrate svgr`. TypeScript 7 has no JS compiler API yet. See [Migrate from SVGR](/docs/migrate-from-svgr/) for what it converts and what it leaves.

## check

`svgworm check` compiles the icons and compares the result with the files on disk. It writes nothing.

Run it in CI to **fail the build when someone changed an icon and forgot to commit the output**. It lists each missing, changed or stale file and the icon names added or removed.

With `--json`, the document adds `upToDate`, `differences` and `iconDiff` to the build document; see [JSON output](#check-document).

## watch

`svgworm watch` rebuilds after each change in a source folder. It re-optimizes only the icons whose content changed (about 10 ms per rebuild for 1,000 icons). With `--json`, `watch` prints one document per build.

<aside class="alert alert-warning">

<p class="alert-title">Warning</p>

`fs.watch` can miss events on network file systems and container bind mounts. Run `svgworm` by hand there.

</aside>
