export const USAGE = `svgworm: turn a folder of SVG files into type-safe, cacheable SVG sprites.

Usage:
  svgworm [build] [options]
  svgworm check [options]
  svgworm watch [options]
  svgworm init [options] [init options]

Commands:
  build                   Write the sprite, manifest and types (default)
  check                   Exit 1 if the committed output is stale. Writes nothing (CI)
  watch                   Build, then rebuild on every change in the source folders
  init                    Set a project up: config, package.json scripts, Icon wiring.
                          Asks on a terminal; flags answer everything otherwise. Idempotent

Options:
  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names (--no-flatten to undo)
  --json                  Print one JSON document on stdout and nothing else
  --verbose               Print one line per icon (plain output only)
  -h, --help              Show this help
  -v, --version           Show the version

Flags override the config file. --out-dir needs --public-path.

Init options:
  --framework <name>      react or astro. Default: detected from the dependencies (astro wins when both)
  --component-file <path> Where the Icon wiring goes. Default: components/icon.tsx or Icon.astro
                          (under src/components/ when src/ exists)
  --component             Write the Icon wiring even when no framework dependency is found
  --no-component          Skip the Icon wiring (default: written when react, next or astro is a dependency)
  --no-scripts            Do not run svgworm from package.json scripts (predev/prebuild, or dev/build on Yarn 2+)
  --agents-md             Add a short svgworm section to AGENTS.md for AI agents
  -y, --yes               Take the defaults and flags without asking

Exit codes:
  0  built, or check found the output up to date
  1  invalid SVG, name collision, or I/O failure (nothing is written); or stale output (check)
  2  usage or config error, or no SVG files found

Example:
  svgworm --source icons
  svgworm --source icons --out-dir public/sprites --public-path /sprites --json
  svgworm check --json
  svgworm init --source icons --agents-md --yes

Config (svgworm.config.json):
  { "sources": ["icons"], "color": [{ "match": "brand/*", "color": "preserve" }] }
`;
