#!/usr/bin/env node
// The bin must exist when pnpm links the workspace, before `dist/` is built, or pnpm skips the
// shim and `svgworm` is not found in the example. This file is the stable entry; the CLI is built.
import '../dist/cli/main.js';
