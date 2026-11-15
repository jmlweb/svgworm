---
id: LRN-067
title: path.join(cwd, p) mirrors an absolute p under cwd; resolve configured paths with path.resolve
status: active
tags: [core, config, paths]
task: TSK-109
created: 2026-11-15
---

`path.join(cwd, '/abs')` gives `<cwd>/abs`; it never resets on an absolute second argument. The core used `join` for sources, outDir and moduleDir while `resolveConfig` validated them with `path.resolve`, so validation and the build looked at different folders and an absolute outDir was silently mirrored under cwd. Any path the user configures must go through `path.resolve(cwd, p)`; keep `join` only for a file name inside an already-resolved folder. TSK-107 (`--config`) has the same mistake.
