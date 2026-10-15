---
title: CLI reference
description: Every svgworm command, flag and exit code. Build sprites, check that committed output is current in CI, watch for changes, and set a project up, with stable plain and --json output.
order: 3
---

One command builds everything. The others check, watch, and set a project up.

```text
svgworm [build] [options]    Write the sprite, manifest and types (default)
svgworm check [options]      Exit 1 if the committed output is stale. Writes nothing (CI)
svgworm watch [options]      Build, then rebuild on every change in the source folders
svgworm init [options]       Set a project up: config, predev/prebuild scripts, Icon wiring (React or Astro)

  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names (--no-flatten to undo)
  --json                  Print one JSON document on stdout and nothing else
  -h, --help              Show this help
  -v, --version           Show the version
```

Flags override the config file. The same options are available as [config keys](/docs/config/).

<aside class="alert alert-important">

<p class="alert-title">Important</p>

`--out-dir` needs `--public-path`.

</aside>

## Exit codes

| Exit code | Meaning                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| `0`       | Built, or `check` found the output up to date                                                   |
| `1`       | Invalid SVG, name collision, or I/O failure (nothing is written); or `check` found stale output |
| `2`       | Usage or config error, or no SVG files found                                                    |

## Output

At the end of a build the CLI prints stats (icons, sprites, sizes, savings, time). When stdout is not a terminal, or with `--json`, the output is plain and stable, so scripts and AI agents can read it.

## init

`svgworm init` prompts on a terminal and takes flags everywhere else:

| Flag                      | Effect                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--framework <name>`      | `react` or `astro`. Default: detected from the dependencies; Astro wins when both are present (a terminal asks)             |
| `--component-file <path>` | Where to create the `Icon` component. The extension must match the framework (`.tsx`/`.jsx` or `.astro`), or `init` exits 2 |
| `--no-component`          | Skip the component                                                                                                          |
| `--no-scripts`            | Skip the `predev` and `prebuild` scripts                                                                                    |
| `--agents-md`             | Add a short svgworm section to `AGENTS.md` for AI agents                                                                    |
| `--yes`, `-y`             | Accept every default without asking                                                                                         |

`init` reports the framework it chose and why (`flag` or `detected`) in the plain output and as `framework` and `frameworkSource` in `--json`. For Astro it writes `Icon.astro` instead of the React wiring; see the [Astro setup](/docs/astro/).

It never overwrites a file that differs from what it would write, so re-running it is safe.

## check

`svgworm check` compiles the icons and compares the result with the files on disk, so CI can fail when someone changed an icon and forgot to commit the output. It lists each missing, changed or stale file and the icon names added or removed.

## watch

`svgworm watch` rebuilds after each change in a source folder and re-optimizes only the icons whose content changed (about 10 ms per rebuild for 1,000 icons). With `--json`, `watch` prints one document per build.

<aside class="alert alert-warning">

<p class="alert-title">Warning</p>

`fs.watch` can miss events on network file systems and container bind mounts. Run `svgworm` by hand there.

</aside>
