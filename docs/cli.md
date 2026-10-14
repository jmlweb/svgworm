# CLI reference

```text
svgworm [build] [options]    Write the sprite, manifest and types (default)
svgworm check [options]      Exit 1 if the committed output is stale. Writes nothing (CI)
svgworm watch [options]      Build, then rebuild on every change in the source folders
svgworm init [options]       Set a project up: config, predev/prebuild scripts, Icon wiring

  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names
  --json                  Print one JSON document on stdout and nothing else
```

Flags override the config file. `--out-dir` needs `--public-path`. The same options are available as [config keys](config.md).

## Exit codes

| Exit code | Meaning                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| `0`       | Built, or `check` found the output up to date                                                   |
| `1`       | Invalid SVG, name collision, or I/O failure (nothing is written); or `check` found stale output |
| `2`       | Usage or config error, or no SVG files found                                                    |

## Output

At the end of a build the CLI prints stats (icons, sprites, sizes, savings, time). When stdout is not a terminal, or with `--json`, the output is plain and stable.

## init

`svgworm init` prompts on a terminal and takes flags everywhere else: `--component-file <path>`, `--no-component`, `--no-scripts`, `--agents-md` (adds a short svgworm section to `AGENTS.md` for AI agents) and `--yes`. It never overwrites a file that differs from what it would write, so re-running it is safe.

## check

`svgworm check` compiles the icons and compares the result with the files on disk, so CI can fail when someone changed an icon and forgot to commit the output. It lists each missing, changed or stale file and the icon names added or removed.

## watch

`svgworm watch` rebuilds after each change in a source folder and re-optimizes only the icons whose content changed (about 10 ms per rebuild for 1,000 icons). `fs.watch` can miss events on network file systems and container bind mounts; run `svgworm` by hand there. With `--json`, `watch` prints one document per build.
