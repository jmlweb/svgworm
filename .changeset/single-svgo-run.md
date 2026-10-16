---
'svgworm': patch
'@svgworm/react': patch
---

Faster builds: each icon now goes through svgo once instead of five times. A cold build of lucide-static 1.57 (2,154 icons) spends about 25% less time transforming icons. The output is byte-identical and the errors are the same, in the same order.
