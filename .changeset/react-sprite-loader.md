---
'@svgworm/react': minor
---

Reads the version 2 manifest that `crossOrigin: "inject"` writes (ADR-0027): `use` icons render `<use href="#id">` against the sprite the loader injects, and the new `createSpriteLoader(manifest)` renders the loader tag (`<script async src integrity crossorigin="anonymous">`) once, in the root layout. It renders nothing for a same-origin manifest, so version 1 output works exactly as before.

**Breaking (inject mode only):** a version 2 manifest is rejected by earlier `@svgworm/react` releases with "Unsupported svgworm manifest version 2"; update both packages together.
