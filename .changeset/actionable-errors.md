---
'svgworm': patch
'@svgworm/react': patch
---

Errors now say what to do next:

- An unknown CLI flag suggests the closest known one (`unknown flag "--sources". Did you mean "--source"?`) instead of Node's positional-argument explanation.
- A `name/collision` error ends with a fix: rename one of the files, or turn `flatten` off when the files sit in different folders.
- The `Unknown icon` error thrown by the `@svgworm/react` component lists the closest icon names from the manifest.
- An `svg/invalid-xml` message reads `line 2, column 0: …` instead of showing svgo's `<input>:2:0:` placeholder as the location.
