---
'svgworm': minor
---

License notices from the source files survive the build. An XML comment whose text starts with `@license` (Lucide, Tabler, svgo's own convention) or `!` (Font Awesome, minifiers) is written once per distinct text before the root element of the sprite or stack file that holds the icon, trimmed and sorted, so an ISC or MIT attribution travels with the copies. Every other comment is still dropped, including a `<!--! … -->` inside an icon, which svgo's preset used to keep in the symbol. The comment bytes are part of the content hash, so sprites built from files with such notices get a new name once.
