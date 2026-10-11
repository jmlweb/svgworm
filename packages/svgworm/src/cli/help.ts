export const USAGE = `svgworm: turn a folder of SVG files into type-safe, cacheable SVG sprites.

Usage:
  svgworm [build] [options]

Options:
  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names (--no-flatten to undo)
  --json                  Print one JSON document on stdout and nothing else
  -h, --help              Show this help
  -v, --version           Show the version

Flags override the config file. --out-dir needs --public-path.

Exit codes:
  0  built
  1  invalid SVG, name collision, or I/O failure (nothing is written)
  2  usage or config error, or no SVG files found

Example:
  svgworm --source icons
  svgworm --source icons --out-dir public/sprites --public-path /sprites --json

Config (svgworm.config.json):
  { "sources": ["icons"], "color": [{ "match": "brand/*", "color": "preserve" }] }
`;
