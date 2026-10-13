# svgworm

Turn a folder of SVG files into type-safe, content-hashed SVG sprites, a manifest and TypeScript types. Zero client JavaScript, deterministic output, per-icon color handling.

```bash
svgworm --source icons
```

Pair it with [`@svgworm/react`](https://github.com/jmlweb/svgworm/tree/main/packages/react) for a Server Component `Icon`.

Config file: `svgworm.config.json`, with a JSON Schema at `svgworm/schema.json`.

Docs, quick start, CLI reference and comparison: <https://github.com/jmlweb/svgworm#readme>. For AI agents: [llms.txt](https://github.com/jmlweb/svgworm/blob/main/llms.txt).

Status: 0.1.x. Flags and the output contract can still change in a minor version before 1.0; see the changelog.
