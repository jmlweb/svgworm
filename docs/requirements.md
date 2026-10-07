# Requirements

User stories, with no implementation detail. IDs (R-xx) are referenced from tasks.

## Input

- **R-01** As a developer, I point the CLI at one or more source folders of `.svg` files.
- **R-02** Subfolders can map to namespaces (`social/github`) or be flattened. Either way, the result is deterministic.
- **R-03** Name collisions produce an error that lists every conflicting file. They are never silently renamed.
- **R-04** Invalid or unsupported SVGs are reported with the file path and reason. The rest of the build continues, and the exit code reflects the failures.

## Output

- **R-10** One or more hashed sprite files, written to a directory I choose (usually a public or static folder).
- **R-11** A manifest that maps each sprite to its public URL (with a configurable base path) and lists the icons in it.
- **R-12** Types that make icon names a compile-time check.
- **R-13** Optional inline sprite output for small sets or single-file deliverables.
- **R-14** Output is byte-identical across runs and operating systems for the same input.
- **R-15** Stale sprite files from earlier builds are cleaned up safely, removing only files svgworm created.

## Icon processing

- **R-20** Each icon is optimized, and its internal ids are made unique per icon.
- **R-21** Color is handled per icon: mono icons inherit `currentColor`, multicolor icons keep their colors, and stroke icons keep their stroke semantics.
- **R-22** I can override the color strategy for each icon or each folder.
- **R-23** Each `viewBox` is preserved. An icon without a `viewBox` causes an error or a derived `viewBox`, as decided in an ADR.

## Workflow

- **R-30** Watch mode rebuilds only what changed.
- **R-31** Check mode exits non-zero if the committed output is stale (for CI).
- **R-32** Config can come from a file, from CLI flags, or from both, and the config is validated.
- **R-33** A programmatic API that matches the CLI.

## React adapter

- **R-40** An `Icon` component that is valid in Server Components and ships no client JS.
- **R-41** The `name` prop is typed against the generated names.
- **R-42** Accessible by default: decorative icons are `aria-hidden`, and a `title` prop makes an icon labelled.
- **R-43** Size and color are set through standard SVG props or CSS. No custom styling API.
- **R-44** Works with multiple sprites or namespaces without the caller knowing which sprite an icon lives in.

## Non-functional

- **R-50** Builds 1,000 icons in well under a few seconds on a laptop (the exact budget is set after the spikes).
- **R-51** Few runtime dependencies for consumers. The adapter has zero dependencies beyond React.
- **R-52** Clear, actionable error messages.
