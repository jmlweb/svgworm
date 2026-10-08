#!/usr/bin/env node
import { parseArgs } from 'node:util'

// Scaffold only: subcommands, reporters and exit-code contract arrive with TSK-011.
const USAGE = `svgworm: turn a folder of SVG files into type-safe sprites.

Usage: svgworm [--help]

The build command is not implemented yet.
`

export const run = (argv: readonly string[]): number => {
  try {
    const { values } = parseArgs({ args: [...argv], options: { help: { type: 'boolean' } } })
    if (values.help) {
      process.stdout.write(USAGE)
      return 0
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`)
    return 2
  }
  process.stderr.write(USAGE)
  return 2
}

process.exitCode = run(process.argv.slice(2))
