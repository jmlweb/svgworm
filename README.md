# svgworm

> Turn a folder of SVG files into type-safe, cacheable SVG sprites. A framework-agnostic CLI with deterministic output, plus a thin React adapter that works in Server Components with zero client JavaScript.

**Status: pre-alpha, v0.1 in progress.** The CLI builds sprites, a manifest and types. The React adapter (`@svgworm/react`) has `createIcon`. Nothing is on npm yet, so the commands below use the repo build until v0.1.0 is published. The previous prototype lives on `main` and is kept only as a reference.

## Why

- **Icons that render right, with no config.** Each icon is classified as mono (follows `currentColor`) or multicolor (keeps its colors). Gradients, masks and filters render in Chromium, Firefox and WebKit.
- **Zero client JS.** Icons are `<svg><use href="/icons/icons.<hash>.svg#id"/></svg>` pointing at a hashed file the browser caches.
- **Type-safe names.** `<Icon name="nope" />` is a compile error.
- **No bundler plugin.** It is a CLI that writes files, so it works with Turbopack, webpack and Vite.
- **Deterministic.** The same input gives byte-identical output on every OS.

See [how it compares](docs/comparison.md) with SVGR, @neodx/svg and vite-plugin-icons-spritesheet, including where each one is the better choice.

## Quick start (Next.js App Router)

Requires Node `^22.20 || >=24.11`.

1. Put your SVG files in `icons/`.

2. Install and build the sprite. After the v0.1.0 release:

   ```bash
   pnpm add -D svgworm
   pnpm add @svgworm/react
   pnpm svgworm --source icons
   ```

   Before it, build from this repo and point the CLI at your folder:

   ```bash
   git clone https://github.com/jmlweb/svgworm && cd svgworm
   pnpm install && pnpm build
   node packages/svgworm/dist/cli/main.js --source fixtures/mono-fill
   ```

   This writes the sprite to `public/icons/` and the manifest and types to `svgworm/`:

   ```text
   public/icons/icons.<hash>.svg   sprite (and icons.stack.<hash>.svg when an icon needs it)
   svgworm/icons.js                manifest (data only)
   svgworm/icons.d.ts              types: IconName and the manifest shape
   svgworm/manifest.json           same manifest, for scripts and templates
   ```

3. Create the component once, in a Server Component file:

   ```tsx
   // components/icon.tsx
   import { createIcon } from '@svgworm/react';

   import { manifest } from '../svgworm/icons.js';

   export const Icon = createIcon(manifest);
   ```

4. Use it anywhere on the server:

   ```tsx
   <Icon name="home" />
   <Icon name="brand/sunset" width={32} height={32} />
   <Icon name="home" title="Go home" />
   ```

   The icon is `aria-hidden` unless you pass `title` or `label`.

5. Run the CLI before `dev` and `build`:

   ```json
   { "scripts": { "predev": "svgworm", "prebuild": "svgworm" } }
   ```

6. Cache the hashed files for a year. Next serves `public/` with `max-age=0`, and the file names are content-hashed, so this is safe:

   ```ts
   // next.config.ts
   export default {
     async headers() {
       return [
         {
           source: '/icons/:file*',
           headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
         },
       ];
     },
   };
   ```

   With a `basePath` of `/docs`, set `--public-path /docs/icons`. Next does not add `basePath` to a raw `href`.

## CLI

```text
svgworm [build] [options]

  --config <file>         Config file. Default: svgworm.config.json (optional)
  --source <dir>          Folder with the SVG files. Repeat for several folders
  --out-dir <dir>         Where sprite files are written. Default: public/icons
  --public-path <path>    URL path the sprites are served from. Default: /icons
  --module-dir <dir>      Where the manifest and types are written. Default: svgworm
  --flatten               Drop folder names from icon names
  --json                  Print one JSON document on stdout and nothing else
```

Flags override the config file. `--out-dir` needs `--public-path`.

| Exit code | Meaning                                                         |
| --------- | --------------------------------------------------------------- |
| `0`       | Built                                                           |
| `1`       | Invalid SVG, name collision, or I/O failure. Nothing is written |
| `2`       | Usage or config error, or no SVG files found                    |

It prints stats at the end (icons, sprites, sizes, savings, time). When stdout is not a terminal, or with `--json`, the output is plain and stable.

## Config

`svgworm.config.json` is optional. It has a [JSON Schema](packages/svgworm/svgworm.schema.json), published as `svgworm/schema.json`:

```json
{
  "$schema": "https://unpkg.com/svgworm/svgworm.schema.json",
  "sources": ["icons"],
  "color": [{ "match": "brand/*", "color": "preserve" }]
}
```

| Key          | Default        | Meaning                                                                            |
| ------------ | -------------- | ---------------------------------------------------------------------------------- |
| `sources`    | required       | Folders with the SVG files                                                         |
| `outDir`     | `public/icons` | Where sprite files go. Needs `publicPath` when set                                 |
| `publicPath` | `/icons`       | Same-origin URL path the sprites are served from                                   |
| `moduleDir`  | `svgworm`      | Where the manifest and types go                                                    |
| `flatten`    | `false`        | Drop folder names from icon names                                                  |
| `color`      | `[]`           | Per-icon overrides. `match` is a glob on the icon name; `color` is `auto`, `mono` or `preserve`. The last match wins |

## Docs

| Doc                                                | Purpose                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| [docs/comparison.md](docs/comparison.md)           | svgworm vs SVGR, @neodx/svg and others            |
| [docs/vision.md](docs/vision.md)                   | Problem, users, positioning, non-goals            |
| [docs/viability.md](docs/viability.md)             | Viability analysis and lessons from the prototype |
| [docs/requirements.md](docs/requirements.md)       | Functional requirements (user stories)            |
| [docs/output-contract.md](docs/output-contract.md) | v0.1 contract of what the CLI generates           |
| [docs/open-questions.md](docs/open-questions.md)   | Unresolved questions that feed the spikes         |
| [docs/adr/](docs/adr/)                             | Architecture Decision Records                     |
| [llms.txt](llms.txt)                               | Summary for AI agents                             |

## For AI agents

Read [llms.txt](llms.txt). Everything is non-interactive: flags, `--json`, stable exit codes, and a JSON Schema for the config.

## Working on this project

Read [AGENTS.md](AGENTS.md). The backlog is managed with flowstate in [`.backlog/`](.backlog/).

## License

MIT
