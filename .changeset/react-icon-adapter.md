---
'@svgworm/react': minor
---

Add `createIcon(manifest)`, a hook-free Server Component factory. Pass the generated `manifest` once and get an `Icon` whose `name` prop is typed against the generated icon names. It renders each icon by its manifest `delivery` (`use`, `img` or `mask`), resolves URLs and symbol ids from the manifest, and is `aria-hidden` unless a `title` or `label` is given. It throws `SvgwormReactError` for an unknown manifest version, an unknown name, or a missing sprite or stack file.
