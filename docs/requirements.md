# Requirements

User stories, with no implementation detail. IDs (R-xx) are referenced from tasks.

## Input

- **R-01** As a developer, I point the CLI at one or more source folders of `.svg` files. _[v0.1]_
- **R-02** Subfolders can map to namespaces (`social/github`) or be flattened. Either way, the result is deterministic. _[v0.1]_ Rules: [ADR-0007](adr/0007-icon-naming-and-collision-policy.md).
- **R-03** Name collisions produce an error that lists every conflicting file. They are never silently renamed. _[v0.1]_ Rules: [ADR-0007](adr/0007-icon-naming-and-collision-policy.md).
- **R-04** Invalid or unsupported SVGs are reported with the file path and reason. All errors are collected and reported together, the build exits non-zero, and no output is written (previous output stays untouched). _[v0.1]_

## Output

- **R-10** One or more hashed sprite files, written to a directory I choose (usually a public or static folder). _[v0.1]_
- **R-11** A manifest that maps each sprite to its public URL (with a configurable base path) and lists the icons in it. _[v0.1]_ Shape: [ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md).
- **R-12** Types that make icon names a compile-time check. _[v0.1]_
- **R-13** Optional inline sprite output for small sets or single-file deliverables. _[post-v0.1]_
- **R-14** Output is byte-identical across runs and operating systems for the same input. _[v0.1]_
- **R-15** Stale sprite files from earlier builds are cleaned up safely, removing only files svgworm created. _[v0.1]_ Name pattern and write order: [ADR-0010](adr/0010-sprite-url-delivery-generated-module-and-public-path.md).

## Icon processing

- **R-20** Each icon is optimized, and its internal ids are made unique per icon. _[v0.1]_
- **R-21** Color is handled per icon: mono icons inherit `currentColor`, multicolor icons keep their colors, and stroke icons keep their stroke semantics. _[v0.1]_
- **R-22** I can override the color strategy for each icon or each folder. _[v0.1]_
- **R-23** Each `viewBox` is preserved. An icon without a `viewBox` gets one derived from plain-number or `px` `width`/`height` (reported by the CLI), and otherwise causes an error ([ADR-0006](adr/0006-per-icon-delivery-external-use-and-svg-stack.md)). _[v0.1]_

## Workflow

- **R-30** Watch mode rebuilds only what changed. _[v0.1 full rebuild; incremental post-v0.1]_
- **R-31** Check mode exits non-zero if the committed output is stale (for CI). _[v0.1]_
- **R-32** Config can come from a file, from CLI flags, or from both, and the config is validated. _[v0.1]_
- **R-33** A programmatic API that matches the CLI. _[v0.1]_

## React adapter

- **R-40** An `Icon` component that is valid in Server Components and ships no client JS. _[v0.1]_
- **R-41** The `name` prop is typed against the generated names. _[v0.1]_
- **R-42** Accessible by default: decorative icons are `aria-hidden`, and a `title` prop makes an icon labelled. _[v0.1]_
- **R-43** Size and color are set through standard SVG props or CSS. No custom styling API. _[v0.1]_
- **R-44** Works with multiple sprites or namespaces without the caller knowing which sprite an icon lives in. _[v0.1 single sprite; multi-sprite post-v0.1]_

## Non-functional

- **R-50** Builds 1,000 icons in a few seconds on a laptop. The exact budget is set by a benchmark once the walking skeleton exists. _[v0.1]_
- **R-51** Few runtime dependencies for consumers. The adapter has zero dependencies beyond React. _[v0.1]_
- **R-52** Clear, actionable error messages. _[v0.1]_
- **R-53** A polished CLI experience: animated progress, interactive prompts (for example `init`), and a stats summary at the end of each run. In a non-TTY or with `--json`, output is plain, stable, and machine-readable. _[v0.1]_
- **R-54** Supports current, maintained versions of runtimes, browsers, and tools only. No legacy compatibility work. _[v0.1]_
- **R-55** Discoverable by search engines and AI agents: keyword-rich README and npm metadata, an `llms.txt`, a published JSON Schema for the config, and copy-pasteable examples. _[v0.1]_
- **R-56** Every interactive CLI flow has a non-interactive equivalent (flags, `--json`, stable exit codes), so AI agents and scripts can drive it. _[v0.1]_
