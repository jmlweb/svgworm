# svgworm

Turn a folder of SVG files into type-safe, content-hashed SVG sprites, a manifest and TypeScript types. Zero client JavaScript, deterministic output, per-icon color handling.

[![CI](https://github.com/jmlweb/svgworm/actions/workflows/ci.yml/badge.svg)](https://github.com/jmlweb/svgworm/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/svgworm)](https://github.com/jmlweb/svgworm/blob/main/LICENSE)

```bash
pnpm add -D svgworm
pnpm svgworm init        # config, predev/prebuild scripts, Icon component
pnpm svgworm             # write the sprite, manifest and types
```

![svgworm turns a folder of SVG files into a hashed sprite, a manifest and types](https://raw.githubusercontent.com/jmlweb/svgworm/main/docs/assets/pipeline.svg)

Pair it with [`@svgworm/react`](https://github.com/jmlweb/svgworm/tree/main/packages/react) for a Server Component `Icon` where a wrong name is a type error.

- [CLI reference](https://github.com/jmlweb/svgworm/blob/main/docs/cli.md)
- [Config](https://github.com/jmlweb/svgworm/blob/main/docs/config.md): `svgworm.config.json`, with a JSON Schema at `svgworm/schema.json`
- [Next.js setup](https://github.com/jmlweb/svgworm/blob/main/docs/nextjs.md)
- [Comparison](https://github.com/jmlweb/svgworm/blob/main/docs/comparison.md) with SVGR, @neodx/svg and others
- For AI agents: [llms.txt](https://github.com/jmlweb/svgworm/blob/main/llms.txt)

Status: 0.1.x. Flags and the output contract can still change in a minor version before 1.0; see the changelog.
