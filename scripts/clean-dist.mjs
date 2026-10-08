import { rmSync } from 'node:fs'

// Cross-platform `rm -rf dist` for package build scripts (cmd.exe has no rm).
rmSync('dist', { recursive: true, force: true })
