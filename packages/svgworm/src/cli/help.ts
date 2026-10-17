export const USAGE = `svgworm: turn a folder of SVG files into type-safe, cacheable SVG sprites.

Usage:
  svgworm [build] [options]
  svgworm check [options]
  svgworm watch [options]
  svgworm init [options] [init options]
  svgworm migrate svgr [options] [--write] [--component-file <path>]

Commands:
  build                   Write the sprite, manifest and types (default)
  check                   Exit 1 if the committed output is stale. Writes nothing (CI)
  watch                   Build, then rebuild on every change in the source folders
  init                    Set a project up: config, package.json scripts, Icon wiring.
                          Asks on a terminal; flags answer everything otherwise. Idempotent
  migrate svgr            Rewrite SVGR imports (import Logo from './logo.svg') into
                          <Icon name="logo" /> calls. A dry run unless --write. Needs
                          TypeScript 5 or 6 in the project (or: npx -p typescript@6 -p svgworm)

Options:
  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders. Default: icons
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names (--no-flatten to undo)
  --cross-origin <mode>   none (default) or inject: allow an https:// --public-path on a CDN,
                          loaded by a small script (icons need JS in that mode)
  --json                  Print one JSON document on stdout and nothing else
  --verbose               Print one line per icon (plain output only)
  -h, --help              Show this help
  -v, --version           Show the version

Flags override the config file. --out-dir needs --public-path, unless it is under public/
(public/sprites gives /sprites).

Init options:
  --framework <name>      react, astro, vue or svelte. Default: detected from the dependencies
                          (astro, then vue or nuxt, then svelte, then react or next)
  --component-file <path> Where the Icon wiring goes. Default: components/icon.tsx, Icon.astro,
                          Icon.vue or Icon.svelte (under src/components/ when src/ exists;
                          src/lib/components/ for SvelteKit, app/components/ for Nuxt 4)
  --component             Write the Icon wiring even when no framework dependency is found
  --no-component          Skip the Icon wiring (default: written when a framework is a dependency)
  --cdn-url <https-url>   Serve sprites from a CDN on another origin (crossOrigin: inject).
                          React and Astro only
  --no-scripts            Do not run svgworm from package.json scripts (predev/prebuild, or dev/build on Yarn 2+)
  --agents-md             Add a short svgworm section to AGENTS.md for AI agents
  -y, --yes               Take the defaults and flags without asking

Migrate options:
  --write                 Change the files. Without it, print what would change
  --component-file <path> The Icon component to import. Default: src/components/icon.tsx
                          or components/icon.tsx, as svgworm init writes it

Exit codes:
  0  built, or check found the output up to date
  1  invalid SVG, name collision, or I/O failure (nothing is written); or stale output (check);
     or imports left on SVGR (migrate)
  2  usage or config error, or no SVG files found

Example:
  svgworm
  svgworm --source assets/svg --out-dir static/sprites --public-path /sprites --json
  svgworm check --json
  svgworm init --source icons --agents-md --yes
  svgworm migrate svgr --write

Config (svgworm.config.json):
  { "sources": ["icons"], "color": [{ "match": "brand/*", "color": "preserve" }] }
`;
